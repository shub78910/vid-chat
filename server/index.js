const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const wss = new WebSocket.Server({ port: 3001 });

// In-memory room map: roomId -> Set of clients
const rooms = new Map();

function getRoomClients(roomId) {
  console.log({ rooms });

  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  return rooms.get(roomId);
}

wss.on("connection", (ws) => {
  let roomId = null;
  let clientId = uuidv4();

  ws.on("message", (message) => {
    let data;
    try {
      console.log({message});
      
      data = JSON.parse(message.toString());
    } catch (e) {
      ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
      return;
    }

    if (data.type === "join" && typeof data.roomId === "string") {
      roomId = data.roomId;
      const clients = getRoomClients(roomId);
      
      // Send room size before adding the new client
      ws.send(
        JSON.stringify({ type: "joined", clientId, roomSize: clients.size })
      );
      if (clients.size < 2) {
        // Notify existing clients that a new user joined
        for (const client of clients) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "user-joined" }));
          }
        }
        clients.add(ws);
      } else {
        ws.send(JSON.stringify({ type: "error", message: "Room full" }));
        ws.close();
      }
      return;
    }

    // Only relay signaling messages to other clients in the same room
    if (roomId && ["offer", "answer", "ice-candidate"].includes(data.type)) {
      const clients = getRoomClients(roomId);
      for (const client of clients) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      }
    }
  });

  ws.on("close", () => {
    if (roomId) {
      const clients = getRoomClients(roomId);
      clients.delete(ws);
      if (clients.size === 0) rooms.delete(roomId);
    }
  });
});

console.log("WebSocket signaling server running on ws://localhost:3001");
