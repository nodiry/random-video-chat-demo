// services/socket.ts
import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { addUser, getUser, listUsers, removeUser } from "../utils/cache";

let io: Server | null = null;

// Queue to hold users waiting for a match
let waitingQueue: string[] = [];

// Map socket IDs to nicknames for easy lookup
const socketToNick = new Map<string, string>();

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    const { nick, did } = socket.handshake.auth as {
      nick?: string;
      did?: string;
    };

    // 1. Basic validation - make sure nick and did exist
    if (!nick || !did) {
      socket.emit("error", "Missing nick or did");
      socket.disconnect();
      return;
    }

    // 2. Check if nickname is already taken by someone else
    const existing = getUser(nick);
    if (existing && existing.did !== did) {
      socket.emit("nick_taken");
      socket.disconnect();
      return;
    }

    // 3. Save user in cache (memcached)
    addUser(nick, did, socket.id);
    socket.emit("welcome", { nick, did });

    // 4. Handle text messages (chat)
    socket.on("message", (msg: string) => {
      io?.emit("message", { from: nick, text: msg });
    });

    // 5. Ping/pong for connection testing
    socket.on("ping", () => socket.emit("pong"));

    // ========== WEBRTC MATCHING LOGIC ==========

    // When user wants to find a random match
    socket.on("find_match", () => {
      // Don't add them if they're already waiting
      if (waitingQueue.includes(socket.id)) {
        return;
      }

      // If there's someone waiting, match them together
      if (waitingQueue.length > 0) {
        const partnerId = waitingQueue.shift(); // get first person in queue

        if (partnerId) {
          // IMPORTANT: Only tell the NEW person they matched (they'll initiate)
          // The waiting person receives "matched_as_receiver" (they won't initiate)
          // Also send nicknames so they can see who they're talking to
          socket.emit("matched", {
            partnerId,
            shouldInitiate: true,
            partnerNick:
              getUser(listUsers().find((u) => u.id === partnerId)?.nick || "")
                ?.nick || "Anonymous",
          });
          io?.to(partnerId).emit("matched", {
            partnerId: socket.id,
            shouldInitiate: false,
            partnerNick: nick,
          });

          console.log(`🤝 Matched: ${socket.id} (${nick}) ↔️ ${partnerId}`);
        }
      } else {
        // No one waiting? Add this user to the queue
        waitingQueue.push(socket.id);
        socket.emit("searching"); // let them know we're looking
        console.log(`⏳ ${socket.id} added to queue`);
      }
    });

    // Cancel searching for a match
    socket.on("cancel_search", () => {
      waitingQueue = waitingQueue.filter((id) => id !== socket.id);
      console.log(`❌ ${socket.id} cancelled search`);
    });

    // ========== WEBRTC SIGNALING ==========

    // When user sends their WebRTC offer to partner
    socket.on("webrtc_offer", ({ offer, to }) => {
      io?.to(to).emit("webrtc_offer", { offer, from: socket.id });
      console.log(`📤 Offer: ${socket.id} → ${to}`);
    });

    // When user sends their WebRTC answer back
    socket.on("webrtc_answer", ({ answer, to }) => {
      io?.to(to).emit("webrtc_answer", { answer, from: socket.id });
      console.log(`📥 Answer: ${socket.id} → ${to}`);
    });

    // When users exchange ICE candidates (network info for connection)
    socket.on("ice_candidate", ({ candidate, to }) => {
      io?.to(to).emit("ice_candidate", { candidate, from: socket.id });
    });

    // When user wants to skip to next person
    socket.on("next", ({ partnerId }) => {
      // Tell partner they got skipped
      if (partnerId) {
        io?.to(partnerId).emit("partner_left");
      }
      // Remove from queue if they're somehow in it
      waitingQueue = waitingQueue.filter((id) => id !== socket.id);
    });

    // 7. Cleanup when user disconnects
    socket.on("disconnect", () => {
      // Find if this user was matched with someone
      // We need to notify their partner
      io?.sockets.sockets.forEach((otherSocket) => {
        if (otherSocket.id !== socket.id) {
          // Tell all other sockets this person left (partner will handle it)
          otherSocket.emit("user_disconnected", { disconnectedId: socket.id });
        }
      });

      removeUser(nick);
      // Remove from waiting queue
      waitingQueue = waitingQueue.filter((id) => id !== socket.id);
      console.log(`🔴 ${nick} left`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.IO not initialized yet!");
  return io;
}
