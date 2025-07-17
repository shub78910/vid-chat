export function stopLocalStream(stream: MediaStream | null) {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
} 