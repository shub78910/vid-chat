import { useState, useRef, useEffect } from 'react';
import type { RefObject } from 'react';

interface Position {
  x: number;
  y: number;
}

export function useDraggableVideo(
  videoContainerRef: RefObject<HTMLDivElement>,
  initialPos: Position = { x: 20, y: 20 }
) {
  const [localVideoPos, setLocalVideoPos] = useState<Position>(initialPos);
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setDragging(true);
    let clientX, clientY;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    if (typeof clientX === 'number' && typeof clientY === 'number') {
      dragOffset.current = {
        x: clientX - localVideoPos.x,
        y: clientY - localVideoPos.y,
      };
    }
    e.preventDefault();
  };

  const handleDrag = (e: MouseEvent | TouchEvent) => {
    if (!dragging) return;
    let clientX, clientY;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }
    const container = videoContainerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      // ask: what are these magic numbers
      const videoW = 160, videoH = 112;
      if (typeof clientX === 'number' && typeof clientY === 'number') {
        let x = clientX - dragOffset.current.x;
        let y = clientY - dragOffset.current.y;
        x = Math.max(0, Math.min(x, rect.width - videoW));
        y = Math.max(0, Math.min(y, rect.height - videoH));
        setLocalVideoPos({ x, y });
      }
    }
  };

  const handleDragEnd = () => {
    setDragging(false);
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('touchmove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchend', handleDragEnd);
    } else {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  return {
    localVideoPos,
    setLocalVideoPos,
    dragging,
    handleDragStart,
    handleDragEnd,
  };
} 