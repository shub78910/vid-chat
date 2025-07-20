interface VideoControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  onSwitchCamera?: () => void;
}

const VideoControls = ({
  isMuted,
  isVideoOff,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
  onSwitchCamera
}: VideoControlsProps) => {
  return (
    <div className="flex justify-center items-center p-6 space-x-4 bg-gray-800">
      {/* Audio Toggle */}
      <button
        onClick={onToggleAudio}
        className={`p-4 rounded-full transition-colors ${
          isMuted 
            ? 'text-white bg-red-600 hover:bg-red-700' 
            : 'text-white bg-gray-600 hover:bg-gray-700'
        }`}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

      {/* Video Toggle */}
      <button
        onClick={onToggleVideo}
        className={`p-4 rounded-full transition-colors ${
          isVideoOff 
            ? 'text-white bg-red-600 hover:bg-red-700' 
            : 'text-white bg-gray-600 hover:bg-gray-700'
        }`}
        title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
      >
        {isVideoOff ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>

      {/* Switch Camera */}
      {onSwitchCamera && (
        <button
          onClick={onSwitchCamera}
          className="p-4 text-white bg-gray-600 rounded-full transition-colors hover:bg-blue-700"
          title="Switch camera"
        >
          {/* Camera switch icon */}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M9 10l-4.553-2.276A1 1 0 003 8.618v6.764a1 1 0 001.447.894L9 14" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-2V7m0 10a5 5 0 100-10 5 5 0 000 10z" />
          </svg>
        </button>
      )}

      {/* End Call */}
      <button
        onClick={onEndCall}
        className="p-4 text-white bg-red-600 rounded-full transition-colors hover:bg-red-700"
        title="End call"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l18 18" />
        </svg>
      </button>
    </div>
  );
};

export default VideoControls; 