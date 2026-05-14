import React, { useState, useRef, type TouchEvent } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const REFRESH_THRESHOLD = 60;
const MAX_DRAG = 100;
const DAMPENING_FACTOR = 0.4;

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (isRefreshing) return;
    
    // Only activate if we're at the absolute top of the document/container
    if (window.scrollY <= 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isPulling.current || isRefreshing) return;
    
    currentY.current = e.touches[0].clientY;
    const dragDistance = currentY.current - startY.current;

    if (dragDistance > 0 && window.scrollY <= 0) {
      // Apply friction/dampening factor and max drag limit
      const dampenedDistance = Math.min(Math.max(0, dragDistance * DAMPENING_FACTOR), MAX_DRAG);
      setPullDistance(dampenedDistance);
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= REFRESH_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(REFRESH_THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Snap back without refreshing if threshold wasn't reached
      setPullDistance(0);
    }
  };

  return (
    <div 
      className="relative w-full h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="fixed top-0 left-0 right-0 flex justify-center z-50 pointer-events-none"
        style={{
          transform: `translateY(${Math.max(pullDistance, isRefreshing ? REFRESH_THRESHOLD : 0)}px)`,
          transition: isPulling.current ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
          marginTop: '-48px' // Start hidden above the viewport
        }}
      >
        <div 
          className="bg-surface text-primary rounded-full p-2 shadow-md flex items-center justify-center border border-outline-variant/20"
          style={{
            opacity: pullDistance > 0 || isRefreshing ? 1 : 0,
            transform: `rotate(${(pullDistance / REFRESH_THRESHOLD) * 360}deg)`,
            transition: isPulling.current ? 'none' : 'opacity 0.3s, transform 0.3s'
          }}
        >
          <svg
            className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      </div>
      {children}
    </div>
  );
};
