import { useState, useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';

interface UseWebRTCResult {
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  callEnded: boolean;
  setError: Dispatch<SetStateAction<string | null>>;
  endCall: () => void;
  hasReceivedOffer: boolean;
  setHasReceivedOffer: Dispatch<SetStateAction<boolean>>;
}

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'joined' | 'user-joined' | 'error' | 'hangup';
  clientId?: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  roomSize?: number;
  message?: string;
}

export function useWebRTC(
  roomId: string | undefined,
  localStream: MediaStream | null,
  navigate: (path: string) => void
): UseWebRTCResult {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasReceivedOffer, setHasReceivedOffer] = useState(false);
  const [callEnded, setCallEnded] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize WebRTC peer connection
  const createPeerConnection = (stream: MediaStream) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    });

    //ask: what is the track here
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    pc.ontrack = (event) => {
      if (!remoteStream) {
        setRemoteStream(event.streams[0]);
        setIsConnected(true);
        setIsConnecting(false);
      }
    };

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

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate
        }));
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // Initialize WebSocket connection
  const connectWebSocket = () => {
    const ws = new WebSocket(import.meta.env.VITE_WS_URL);
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', roomId }));
    };
    ws.onmessage = async (event) => {
      let message: SignalingMessage;
      try {
        if (event.data instanceof Blob) {
          const text = await event.data.text();
          message = JSON.parse(text);
        } else if (typeof event.data === 'string') {
          message = JSON.parse(event.data);
        } else {
          return;
        }
      } catch {
        return;
      }
      switch (message.type) {
        case 'joined':
          if (message.roomSize === 1) {
            await startCall();
          }
          break;
        case 'offer':
          setHasReceivedOffer(true);
          if (peerConnectionRef.current) {
            if (!peerConnectionRef.current.currentRemoteDescription) {
              await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.sdp!));
              const answer = await peerConnectionRef.current.createAnswer();
              await peerConnectionRef.current.setLocalDescription(answer);
              ws.send(JSON.stringify({ type: 'answer', sdp: answer }));
            }
          }
          break;
        case 'answer':
          if (peerConnectionRef.current) {
            if (!peerConnectionRef.current.currentRemoteDescription) {
              await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.sdp!));
            }
          }
          break;
        case 'ice-candidate':
          if (peerConnectionRef.current && message.candidate) {
            try {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(message.candidate));
            } catch {
              // Ignore errors for ICE candidate addition
            }
          }
          break;
        case 'error':
          setError(message.message || 'Unknown error');
          break;
        case 'hangup':
          setCallEnded(true);
          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
          }
          if (wsRef.current) {
            wsRef.current.close();
          }
          break;
      }
    };
    ws.onerror = () => {
      setError('Failed to connect to signaling server');
    };
    ws.onclose = () => {
      setIsConnected(false);
    };
    wsRef.current = ws;
  };

  // Start call (create offer)
  const startCall = async () => {
    if (!peerConnectionRef.current) return;
    try {
      setIsConnecting(true);
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'offer', sdp: offer }));
      }
    } catch {
      setError('Failed to start call');
    }
  };

  // End call
  const endCall = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'hangup' }));
      setTimeout(() => {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
          localStreamRef.current = null;
        }
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
        }
        if (wsRef.current) {
          wsRef.current.close();
        }
        navigate('/');
      }, 150); // 150ms delay to ensure message is sent
      return;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
    navigate('/');
  };

  // Initialize everything when localStream changes
  useEffect(() => {
    if (!localStream) return;
    localStreamRef.current = localStream;
    connectWebSocket();
    createPeerConnection(localStream);
    setTimeout(() => {
      if (!hasReceivedOffer && !isConnecting) {
        startCall();
      }
    }, 2000);
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStream]);

  return {
    remoteStream,
    isConnected,
    isConnecting,
    error,
    callEnded,
    setError,
    endCall,
    hasReceivedOffer,
    setHasReceivedOffer,
  };
} 