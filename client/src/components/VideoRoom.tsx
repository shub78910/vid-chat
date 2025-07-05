import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoControls from './VideoControls';
import ConnectionStatus from './ConnectionStatus';

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'joined' | 'user-joined' | 'error';
  clientId?: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  roomSize?: number;
  message?: string;
}

const VideoRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [hasReceivedOffer, setHasReceivedOffer] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string>('');

  // Initialize WebRTC peer connection
  const createPeerConnection = (stream: MediaStream) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'turn:openrelay.metered.ca:80' },
        { urls: 'turn:openrelay.metered.ca:443' },
        { urls: 'turn:openrelay.metered.ca:443?transport=tcp' }
      ]
    });

    // Add local stream tracks to peer connection
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      if (!remoteStream) {
        setRemoteStream(event.streams[0]);
        setIsConnected(true);
        setIsConnecting(false);
        console.log('Remote stream set');
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setIsConnected(true);
        setIsConnecting(false);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        setIsConnected(false);
        setRemoteStream(null);
        setCallEnded(true);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate
        }));
        console.log('Sent ICE candidate');
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // Initialize WebSocket connection
  const connectWebSocket = () => {
    const ws = new WebSocket(import.meta.env.VITE_WS_URL);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      ws.send(JSON.stringify({ type: 'join', roomId }));
    };

    ws.onmessage = async (event) => {
      let message: SignalingMessage;
      
      try {
        // Handle different message formats
        if (event.data instanceof Blob) {
          const text = await event.data.text();
          message = JSON.parse(text);
        } else if (typeof event.data === 'string') {
          message = JSON.parse(event.data);
        } else {
          console.error('Unknown message format:', typeof event.data);
          return;
        }
      } catch (error) {
        console.error('Failed to parse message:', error, event.data);
        return;
      }
      
      console.log('Received message:', message.type);
      
      switch (message.type) {
        case 'joined':
          clientIdRef.current = message.clientId || '';
          // Only the second client to join should be the initiator
          if (message.roomSize === 1) {
            await startCall();
          }
          break;
        case 'user-joined':
          // No longer needed for initiator logic
          break;
        case 'offer':
          setHasReceivedOffer(true);
          if (peerConnectionRef.current) {
            if (!peerConnectionRef.current.currentRemoteDescription) {
              await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.sdp!));
              const answer = await peerConnectionRef.current.createAnswer();
              await peerConnectionRef.current.setLocalDescription(answer);
              ws.send(JSON.stringify({ type: 'answer', sdp: answer }));
              console.log('Sent answer');
            }
          }
          break;
        case 'answer':
          if (peerConnectionRef.current) {
            if (!peerConnectionRef.current.currentRemoteDescription) {
              await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.sdp!));
              console.log('Set remote description from answer');
            }
          }
          break;
        case 'ice-candidate':
          if (peerConnectionRef.current && message.candidate) {
            try {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(message.candidate));
              console.log('Added ICE candidate');
            } catch (e) {
              console.error('Error adding ICE candidate', e);
            }
          }
          break;
        case 'error':
          setError(message.message || 'Unknown error');
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Failed to connect to signaling server');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    wsRef.current = ws;
  };

  // Initialize local media stream
  const initializeLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Failed to access camera/microphone. Please check permissions.');
      return null;
    }
  };

  // Start call (create offer)
  const startCall = async () => {
    if (!peerConnectionRef.current) return;
    
    try {
      setIsConnecting(true);
      console.log('Creating offer...');
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('Sending offer');
        wsRef.current.send(JSON.stringify({ type: 'offer', sdp: offer }));
      }
    } catch (err) {
      console.error('Error creating offer:', err);
      setError('Failed to start call');
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // End call
  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
    navigate('/');
  };

  // Initialize everything when component mounts
  useEffect(() => {
    const init = async () => {
      const stream = await initializeLocalStream();
      if (!stream) return;
      connectWebSocket();
      createPeerConnection(stream);
      // Wait a bit for WebSocket to connect, then start call if we're the first one
      setTimeout(() => {
        if (!hasReceivedOffer && !isConnecting) {
          console.log('Starting call as initiator');
          startCall();
        }
      }, 2000);
    };

    init();

    // Cleanup on unmount
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (remoteStream) {
      const videoTrack = remoteStream.getVideoTracks()[0];
      if (videoTrack) {
        // Set initial state
        setIsRemoteVideoOff(!videoTrack.enabled || videoTrack.readyState === 'ended');
        // Handler for track state changes
        const handleTrackChange = () => {
          setIsRemoteVideoOff(!videoTrack.enabled || videoTrack.readyState === 'ended');
        };
        videoTrack.addEventListener('ended', handleTrackChange);
        videoTrack.addEventListener('mute', handleTrackChange);
        videoTrack.addEventListener('unmute', handleTrackChange);
        videoTrack.addEventListener('enabled', handleTrackChange);
        // Cleanup
        return () => {
          videoTrack.removeEventListener('ended', handleTrackChange);
          videoTrack.removeEventListener('mute', handleTrackChange);
          videoTrack.removeEventListener('unmute', handleTrackChange);
          videoTrack.removeEventListener('enabled', handleTrackChange);
        };
      } else {
        setIsRemoteVideoOff(true);
      }
    } else {
      setIsRemoteVideoOff(true);
    }
  }, [remoteStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Call Ended Overlay */}
      {callEnded && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-80">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
            <span className="text-5xl mb-4">📞</span>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Call Ended</h2>
            <p className="text-gray-600 mb-6">The other user has left or the connection was lost.</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-xl font-semibold text-white">Room: {roomId}</h1>
        </div>
        <ConnectionStatus isConnected={isConnected} isConnecting={isConnecting} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-600 text-white p-4 text-center">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Video Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-6xl">
          {/* Remote Video (Main) */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full min-h-[600px] max-h-[350px] object-cover transform -scale-x-100"
            />
            {isRemoteVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center mb-4">
                    <span className="text-5xl text-gray-500">👤</span>
                  </div>
                  <p className="text-lg text-gray-400">Video Off</p>
                </div>
              </div>
            )}
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-gray-400">
                    {isConnecting ? 'Connecting...' : 'Waiting for peer to join...'}
                  </p>
                  
                </div>
              </div>
            )}
          </div>

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-4 right-4 w-40 h-28 bg-black rounded-lg overflow-hidden border-2 border-white">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center">
                  <div className="w-8 h-8 bg-gray-600 rounded-full mx-auto mb-2"></div>
                  <p className="text-xs text-gray-400">Camera Off</p>
                </div>
              </div>
            )}
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