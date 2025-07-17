import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VideoControls from "./VideoControls";
import ConnectionStatus from "./ConnectionStatus";
import { useDraggableVideo } from "../hooks/useDraggableVideo";
import { useMediaControls } from "../hooks/useMediaControls";
import { useWebRTC } from "../hooks/useWebRTC";
import { copyToClipboard } from "../utils/copyToClipboard";

const VideoRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [copied, setCopied] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const { localVideoPos, handleDragStart } =
    useDraggableVideo(videoContainerRef as React.RefObject<HTMLDivElement>);
  const { isMuted, isVideoOff, toggleAudio, toggleVideo } =
    useMediaControls(localStream);
  const {
    remoteStream,
    isConnected,
    isConnecting,
    error,
    callEnded,
    setError,
    endCall,
  } = useWebRTC(roomId, localStream, navigate);

  const initializeLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch {
      setError("Failed to access camera/microphone. Please check permissions.");
      return null;
    }
  };

  const handleCopyLink = () => {
    copyToClipboard(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  useEffect(() => {
    initializeLocalStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      {/* Call Ended Overlay */}
      {callEnded && (
        <div className="flex fixed inset-0 z-50 flex-col justify-center items-center bg-opacity-95 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="flex flex-col items-center p-8 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-900 rounded-2xl border border-gray-700 shadow-2xl">
            <span className="mb-4 text-5xl">📞</span>
            <h2 className="mb-2 text-2xl font-bold text-blue-200">Call Ended</h2>
            <p className="mb-6 text-gray-300">The other user has left or the connection was lost.</p>
            <button
              onClick={() => { endCall(); navigate('/'); }}
              className="px-6 py-3 font-semibold text-white bg-blue-700 rounded-lg shadow-md transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Return to Home
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-gray-800 gap-2 sm:gap-0">
        <div className="flex flex-col sm:flex-row sm:items-center w-full sm:w-auto gap-2 sm:gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 transition-colors hover:text-white w-max"
          >
            ← Back
          </button>
          <h1 className="text-base sm:text-xl font-semibold text-white break-all">Room: {roomId}</h1>
          <div className="flex items-center px-2 py-1 bg-gray-700 rounded w-full sm:w-auto">
            <span className="mr-2 text-xs text-blue-200 select-all truncate max-w-[120px] sm:max-w-xs">
              {window.location.href}
            </span>
            <button
              onClick={handleCopyLink}
              className="p-1 text-blue-300 hover:text-blue-500 focus:outline-none"
              title="Copy link"
            >
              {copied ? (
                <span className="text-xs text-green-400">Copied!</span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2"/>
                  <rect x="3" y="3" width="13" height="13" rx="2" strokeWidth="2"/>
                </svg>
              )}
            </button>
          </div>
        </div>
        <div className="mt-2 sm:mt-0">
          <ConnectionStatus isConnected={isConnected} isConnecting={isConnecting} />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 text-center text-white bg-red-600">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Video Container */}
      <div className="flex flex-1 justify-center items-center p-4">
        <div ref={videoContainerRef} className="relative w-full max-w-6xl">
          {/* Remote Video (Main) */}
          <div className="overflow-hidden relative bg-black rounded-lg">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full min-h-[600px] max-h-[350px] object-cover transform -scale-x-100"
            />
            
            {!remoteStream && (
              <div className="flex absolute inset-0 justify-center items-center bg-gray-800">
                <div className="text-center">
                  <div className="mx-auto mb-4 w-12 h-12 rounded-full border-b-2 border-white animate-spin"></div>
                  <p className="text-gray-400">
                    {isConnecting
                      ? "Connecting..."
                      : "Waiting for peer to join..."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div
            className="overflow-hidden absolute bg-black rounded-lg border-2 border-white cursor-move select-none"
            style={{
              top: localVideoPos.y,
              left: localVideoPos.x,
              width: 160,
              height: 112,
              zIndex: 20,
              touchAction: "none",
            }}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="object-cover w-full h-full transform -scale-x-100"
            />
            
          </div>
        </div>
      </div>

      {/* Controls */}
      <VideoControls
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onEndCall={endCall}
      />
    </div>
  );
};

export default VideoRoom;
