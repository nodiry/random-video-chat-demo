// src/hooks/useWebRTC.ts
import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

// ICE servers for NAT traversal (Google's free STUN server)
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useWebRTC(socket: Socket | null) {
  // Store the peer connection object
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  // Store local video stream (your camera/mic)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // Store remote video stream (partner's camera/mic)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Track who we're connected to
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerNick, setPartnerNick] = useState<string | null>(null);

  // Track connection status
  const [status, setStatus] = useState<"idle" | "searching" | "connected">(
    "idle",
  );

  // Initialize local media (camera + microphone)
  useEffect(() => {
    async function getMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        console.log("📹 Got local stream");
      } catch (err) {
        console.error("❌ Failed to get media:", err);
        alert("Please allow camera and microphone access");
      }
    }

    getMedia();

    // Cleanup: stop all tracks when component unmounts
    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
    };
  });

  // Create a new peer connection
  const createPeerConnection = (
    isInitiator: boolean,
    partnerSocketId: string,
  ) => {
    // Close existing connection if any
    if (peerConnection.current) {
      peerConnection.current.close();
    }

    // Create new RTCPeerConnection with STUN servers
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnection.current = pc;

    // Add local stream tracks to the connection
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    // Listen for remote stream
    const remoteStreamObj = new MediaStream();
    pc.ontrack = (event) => {
      console.log("📥 Received remote track");
      event.streams[0].getTracks().forEach((track) => {
        remoteStreamObj.addTrack(track);
      });
      setRemoteStream(remoteStreamObj);
      setStatus("connected");
    };

    // Handle ICE candidates (network routing info)
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("ice_candidate", {
          candidate: event.candidate,
          to: partnerSocketId,
        });
      }
    };

    // Monitor connection state changes
    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed"
      ) {
        handleDisconnect();
      }
    };

    // If we're the one who initiated, create and send offer
    if (isInitiator) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          socket?.emit("webrtc_offer", {
            offer: pc.localDescription,
            to: partnerSocketId,
          });
          console.log("📤 Sent offer to", partnerSocketId);
        })
        .catch((err) => console.error("Error creating offer:", err));
    }

    return pc;
  };

  // Handle incoming WebRTC offer
  useEffect(() => {
    if (!socket) return;

    socket.on("webrtc_offer", async ({ offer, from }) => {
      console.log("📥 Received offer from", from);

      const pc = createPeerConnection(false, from);

      try {
        // Set the received offer
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Create and send answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("webrtc_answer", {
          answer: pc.localDescription,
          to: from,
        });

        console.log("📤 Sent answer to", from);
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    });

    return () => {
      socket.off("webrtc_offer");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, localStream]);

  // Handle incoming WebRTC answer
  useEffect(() => {
    if (!socket) return;

    socket.on("webrtc_answer", async ({ answer, from }) => {
      console.log("📥 Received answer from", from);

      if (peerConnection.current) {
        try {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(answer),
          );
        } catch (err) {
          console.error("Error setting remote description:", err);
        }
      }
    });

    return () => {
      socket.off("webrtc_answer");
    };
  }, [socket]);

  // Handle incoming ICE candidates
  useEffect(() => {
    if (!socket) return;

    socket.on("ice_candidate", async ({ candidate }) => {
      if (peerConnection.current) {
        try {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(candidate),
          );
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      }
    });

    return () => {
      socket.off("ice_candidate");
    };
  }, [socket]);

  // Handle when we get matched with someone
  useEffect(() => {
    if (!socket) return;

    socket.on(
      "matched",
      ({ partnerId: pid, shouldInitiate, partnerNick: pNick }) => {
        console.log("🤝 Matched with", pNick, "| Initiating:", shouldInitiate);
        setPartnerId(pid);
        setPartnerNick(pNick);
        setStatus("connected");

        // Only create offer if we're the initiator
        // The other person will wait for the offer and respond with answer
        createPeerConnection(shouldInitiate, pid);
      },
    );

    socket.on("searching", () => {
      setStatus("searching");
      console.log("⏳ Searching for partner...");
    });

    socket.on("partner_left", () => {
      console.log("👋 Partner left");
      handleDisconnect();
      // Automatically search for next person instead of going idle
      setTimeout(() => {
        socket.emit("find_match");
        setStatus("searching");
      }, 500); // small delay so disconnect cleans up properly
    });

    // Handle when partner's browser closes or disconnects abruptly
    socket.on("user_disconnected", ({ disconnectedId }) => {
      // Only care if it's our current partner
      if (disconnectedId === partnerId) {
        console.log("👋 Partner disconnected");
        handleDisconnect();
        // Auto-search for next person
        setTimeout(() => {
          socket.emit("find_match");
          setStatus("searching");
        }, 500);
      }
    });

    return () => {
      socket.off("matched");
      socket.off("searching");
      socket.off("partner_left");
      socket.off("user_disconnected");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, localStream, partnerId]);

  // Start searching for a match
  const findMatch = () => {
    if (socket) {
      socket.emit("find_match");
      setStatus("searching");
    }
  };

  // Skip to next person
  const nextPerson = () => {
    if (socket && partnerId) {
      socket.emit("next", { partnerId });
      handleDisconnect();
      // Auto-search for next person
      setTimeout(() => {
        socket.emit("find_match");
        setStatus("searching");
      }, 500);
    }
  };

  // Cancel searching
  const cancelSearch = () => {
    if (socket) {
      socket.emit("cancel_search");
      setStatus("idle");
    }
  };

  // Cleanup connection
  const handleDisconnect = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setRemoteStream(null);
    setPartnerId(null);
    setPartnerNick(null);
    setStatus("idle");
  };

  return {
    localStream,
    remoteStream,
    partnerNick,
    status,
    findMatch,
    nextPerson,
    cancelSearch,
  };
}
