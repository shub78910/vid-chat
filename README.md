# Private Video Chat App

A super-simple, private, peer-to-peer video chat app for you and your friends. No accounts, no data storage, no trackers—just share a link and start chatting!

## 🛠️ Tech Stack
- **Frontend:** React (TypeScript), Vite, Tailwind CSS, WebRTC
- **Backend:** Node.js, ws (WebSocket)

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone <this-repo-url>
cd vid chat
```

### 2. Start the Signaling Server
```bash
cd server
npm install
npm start
```
The server runs on `ws://localhost:3001` by default.

### 3. Start the Frontend
```bash
cd client
npm install
npm run dev
```
The app runs on `http://localhost:5173` by default.

---

## 👥 How to Connect with a Friend
1. Open the app in your browser.
2. Click **Start Call** to create a new room. Share the URL (e.g. `http://localhost:5173/room/abc123`) with your friend.
3. Your friend opens the link, joins the room, and you're connected!

---

## 🔌 How It Works
- **WebRTC** handles direct, peer-to-peer video/audio streaming between browsers.
- **WebSocket** (via the Node.js server) is used only for signaling: exchanging connection offers, answers, and ICE candidates so peers can find each other.
- No video/audio ever touches the server—only connection setup messages do.
- No user accounts, no persistent storage, no third-party APIs.

---

## 🛡️ Security & Privacy
- All messages are sanitized and only relayed within the same room.
- No open relay: messages are never broadcast outside your room.
- No data is stored or logged.
- For production, use HTTPS for both frontend and backend.

---

## 🧹 Cleanup
- When a user leaves or refreshes, they're removed from the room.
- If both users leave, the room is deleted from memory.

---

## 📦 Folder Structure
```
vid chat/
  client/   # Frontend (React + Vite + Tailwind)
  server/   # Backend (Node.js + ws)
  README.md
```

---

## ❓ Questions?
This project is intentionally minimal. Fork it, hack it, and enjoy private video chats! 