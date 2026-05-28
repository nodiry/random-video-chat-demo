// src/hooks/useSocket.ts
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface User {
  nick: string;
  did: string;
}

export function useSocket(user: User | null) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    const s = io("https://api.avalanch.uz", {
      auth: { nick: user.nick, did: user.did },
    });

    s.on("connect", () => console.log("✅ connected:", s.id));
    s.on("nick_taken", () => {
      alert("Nickname taken. Choose another one.");
      localStorage.removeItem("nick");
      localStorage.removeItem("did");
      window.location.reload();
    });

    s.on("welcome", (u) => console.log("welcome", u));

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [user]);

  return socket;
}
