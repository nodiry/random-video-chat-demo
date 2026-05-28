# 🎥 Random Video Chat Platform

Simple Omegle-style random video chat platform built to experiment with:

* ⚡ Bun
* 🔌 Socket.IO
* 📹 WebRTC
* ⚛️ React
* 🎨 TailwindCSS

This project focuses on understanding how peer-to-peer browser communication works using WebRTC signaling over WebSockets.

---

# ✨ Features

* Random video matchmaking
* Real-time Socket.IO signaling
* Browser-to-browser WebRTC connection
* Username availability checking
* Simple in-memory user tracking
* Queue-based random pairing
* Lightweight architecture
* Minimal UI and controls

---

# 🧠 Goal Of The Project

The main purpose of this project was learning:

* How WebRTC works internally
* ICE candidate exchange
* SDP offer/answer flow
* WebSocket signaling
* Socket.IO event handling
* Browser peer connection lifecycle
* Real-time matchmaking systems

This is not intended to be a production-ready clone.

It is mainly an educational playground for experimenting with real-time communication systems.

---

# 📁 Project Structure

```txt
root/
 ├── api/      -> Bun + Socket.IO signaling server
 ├── ui/       -> React frontend
 └── README.md
```

---

# ⚙️ Backend Server

The backend server handles:

* User registration
* Username validation
* Matchmaking queue
* WebRTC signaling
* Socket.IO communication

The server stores users in memory only.

If a user refreshes or disconnects, the username becomes available again after cleanup.

---

## 🚀 Running The API

The server runs on:

```txt
http://localhost:8888
```

Start the server:

```bash
bun run start
```

---

# 🖥️ Frontend

The frontend provides:

* Username input
* Video connection UI
* Random matchmaking controls
* WebRTC stream handling

The UI communicates with the Socket.IO backend for signaling.

---

# 🚀 Running The UI

Inside the `ui` folder:

```bash
bun run dev
```

Or build production files:

```bash
bun run build
```

---

# 🔄 WebRTC Flow

The general connection flow:

```txt
Client A
   ↓
Socket.IO signaling
   ↓
Server matchmaking
   ↓
Client B
   ↓
Offer / Answer exchange
   ↓
ICE candidate exchange
   ↓
Direct peer-to-peer video connection
```

---

# 🛠️ Tech Stack

## Backend

* Bun
* Socket.IO

## Frontend

* React
* Vite
* TailwindCSS

## Real-Time Communication

* WebRTC
* Socket.IO Client

---

# ⚠️ Important Notes

## In-Memory Storage

This project uses in-memory state only.

That means:

* Restarting the server resets everything
* No persistence/database
* No authentication
* No scaling support

---

## NAT / TURN Limitations

This project is intentionally simple.

Some users/networks may fail to connect because:

* No TURN relay server
* NAT traversal limitations
* Strict firewall environments

For real production deployments you would normally add:

* STUN/TURN infrastructure
* Persistent sessions
* Moderation systems
* Authentication
* Abuse protection
* Distributed signaling

---

# 📚 Learning Focus

This project was mainly built to understand:

* Real-time systems
* WebSocket architecture
* Peer connection setup
* Signaling servers
* Browser media APIs
* Event-driven communication

---

# 📄 License

MIT
