// src/components/VideoPlayer.tsx
import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import { useWebRTC } from "../hooks/webrtc";

// Accept socket as a prop instead of getting it from context
export default function VideoPlayer({ socket }: { socket: Socket | null }) {
  const {
    localStream,
    remoteStream,
    partnerNick,
    status,
    findMatch,
    nextPerson,
    cancelSearch,
  } = useWebRTC(socket);

  // References to video elements
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Display local stream (your camera)
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Display remote stream (partner's camera)
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      {/* Main video area */}
      <div className="flex-1 relative bg-black rounded-lg overflow-hidden">
        {/* Remote video (partner) - takes full space */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Show status when not connected */}
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center text-white text-2xl">
            {status === "searching" && "🔍 Searching for someone..."}
            {status === "idle" && "Click 'Start' to find someone"}
            {status === "connected" && "📞 Connecting..."}
          </div>
        )}

        {/* Show partner's nickname when connected */}
        {remoteStream && partnerNick && (
          <div className="absolute top-4 left-4 bg-black/60 px-4 py-2 rounded-lg">
            <span className="text-white font-semibold">👤 {partnerNick}</span>
          </div>
        )}

        {/* Local video (you) - small preview in corner */}
        <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted // mute your own audio so you don't hear yourself
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center pb-4">
        {status === "idle" && (
          <button
            onClick={findMatch}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
          >
            Start
          </button>
        )}

        {status === "searching" && (
          <button
            onClick={cancelSearch}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
          >
            Cancel
          </button>
        )}

        {status === "connected" && remoteStream && (
          <button
            onClick={nextPerson}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
