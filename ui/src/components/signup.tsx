// src/components/SignupModal.tsx
import { useState } from "react";

export default function SignupModal({ onSubmit }: { onSubmit: (nick: string, did: string) => void }) {
  const [nick, setNick] = useState("");

  function handleSignup() {
    const n = nick.trim();
    if (!n) return;
    const d = crypto.randomUUID();
    localStorage.setItem("nick", n);
    localStorage.setItem("did", d);
    onSubmit(n, d);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-80">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Welcome!</h2>
        <p className="text-sm text-gray-500 mb-4">
          Pick a nickname to start chatting
        </p>
        <input
          className="w-full border rounded-md p-2 text-gray-800 mb-4 focus:outline-none"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSignup()}
          placeholder="Your nickname..."
        />
        <button
          onClick={handleSignup}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
