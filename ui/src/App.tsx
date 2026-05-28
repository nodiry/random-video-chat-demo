// src/App.tsx
import { useState } from "react";
import { useSocket } from "./hooks/socket";
import VideoPlayer from "./components/video";
import SignupModal from "./components/signup";

export default function App() {
  const sn = localStorage.getItem("nick"); // get stored nickname
  const sd = localStorage.getItem("did"); // get stored device id
  const [user, setUser] = useState(sn && sd ? { nick: sn, did: sd } : null);

  // Create socket connection when user exists
  const socket = useSocket(user);

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 w-full h-screen bg-gray-900">
      {user ? (
        // Pass socket directly as prop - no context needed
        <VideoPlayer socket={socket} />
      ) : (
        <SignupModal onSubmit={(nick, did) => setUser({ nick, did })} />
      )}
    </div>
  );
}
