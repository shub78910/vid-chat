import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const [joinRoomId, setJoinRoomId] = useState('');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-300 via-[#b5c99a] to-red-200">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md mx-4 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-500 via-[#b5c99a] to-red-400 bg-clip-text text-transparent">
            Video Chat
          </h1>
          <p className="text-blue-800">Private, secure, peer-to-peer video calls</p>
        </div>

        <div className="space-y-6">
          {/* Start Call Section */}
          <div className="bg-blue-100 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">Start a New Room</h2>
            <button
              onClick={startCall}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold transition-colors shadow"
            >
              Start New Room
            </button>
          </div>

          {/* Join Call Section */}
          <div className="bg-[#e6f0d5] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-[#6b7a4c]">Join a Room</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="Enter Room ID"
                className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-blue-800 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={joinCall}
                disabled={!joinRoomId.trim()}
                className="w-full py-3 bg-[#b5c99a] hover:bg-[#a3b97c] disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg text-[#38451c] font-semibold transition-colors shadow"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-blue-700">
          <p>Share the room URL with your friend to start chatting!</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 