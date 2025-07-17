import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const [joinRoomId, setJoinRoomId] = useState("");
  const [showDemoNotice, setShowDemoNotice] = useState(true);
  const [roomName, setRoomName] = useState('');
  const navigate = useNavigate();

  // Start a new room with a random ID
  const startCall = () => {
    const id = Math.random().toString(36).substring(2, 8);
    navigate(`/room/${id}`);
  };

  // Join an existing room by ID
  const joinCall = () => {
    if (joinRoomId.trim()) {
      navigate(`/room/${joinRoomId.trim()}`);
    }
  };

  return (
    <>
      {showDemoNotice && (
        <div className="flex z-50 justify-between items-center px-4 py-2 w-full text-yellow-900 bg-yellow-100 border-b border-yellow-300">
          <span>
            ⚠️ <b>Demo Mode:</b> For best results, open this app in two tabs or
            devices on the same WiFi network (Maybe use a phone and a laptop,
            both on the same network).
            <br />
            Cross-network video may not work due to free TURN server
            limitations.
          </span>
          <button
            onClick={() => setShowDemoNotice(false)}
            className="px-3 py-1 ml-4 bg-yellow-200 rounded hover:bg-yellow-300"
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-900 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="p-8 mx-4 w-full max-w-md bg-gradient-to-br from-gray-800 via-gray-900 to-gray-900 rounded-2xl border border-gray-700 shadow-2xl backdrop-blur-lg bg-gray-800/90">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-400 via-cyan-400 to-gray-700">
              VC
            </h1>
            <p className="text-white">
              Private, secure, peer-to-peer video calls
            </p>
          </div>

          <div className="space-y-6">
            {/* Start a New Room Section */}
            <div className="p-6 mb-6 rounded-2xl border border-gray-700 shadow-lg bg-gray-800/90">
              <h2 className="mb-4 text-base font-bold text-gray-300">Start a New Room</h2>
              <input
                id="roomName"
                type="text"
                className="px-4 py-2 mb-4 w-full placeholder-gray-400 text-gray-200 bg-gray-900 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                placeholder="Enter a room name to start a call"
              />
              <button
                className="py-3 w-full text-base font-semibold text-white bg-gray-800 rounded-lg border transition-colors hover:bg-gray-600"
                onClick={startCall}
              >
                Start New Room
              </button>
            </div>

            {/* Join a Room Section */}
            <div className="p-6 mb-8 rounded-xl border border-gray-700 shadow-lg bg-gray-800/90">
              <h2 className="mb-4 text-base font-bold text-cyan-300">Join a Room</h2>
              <input
                id="joinRoomId"
                type="text"
                className="px-4 py-2 mb-4 w-full placeholder-cyan-400 text-cyan-200 bg-gray-900 rounded-lg border border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={joinRoomId}
                onChange={e => setJoinRoomId(e.target.value)}
                placeholder="Enter a room ID to join a call"
              />
              <button
                className="py-3 w-full text-base font-semibold text-white bg-cyan-900 rounded-lg transition-colors hover:bg-cyan-700"
                onClick={joinCall}
              >
                Join Room
              </button>
            </div>
          </div>

          <div className="mt-8 text-sm text-center text-gray-100">
            <p>Share the room URL with your friend to start chatting!</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LandingPage;
