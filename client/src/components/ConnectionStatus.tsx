interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
}

const ConnectionStatus = ({ isConnected, isConnecting }: ConnectionStatusProps) => {
  if (isConnecting) {
    return (
      <div className="flex items-center space-x-2 text-yellow-400">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
        <span className="text-sm">Connecting...</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center space-x-2 text-green-400">
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        <span className="text-sm">Connected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-gray-400">
      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
      <span className="text-sm">Disconnected</span>
    </div>
  );
};

export default ConnectionStatus; 