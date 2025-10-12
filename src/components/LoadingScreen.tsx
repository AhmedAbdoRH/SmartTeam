import React, { useEffect, useState } from 'react';

import Loader from './Loader';

export default function LoadingScreen({
  onFinish,
}: {
  onFinish?: () => void;
}) {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Constants for timing
  const FADE_START_DELAY = 1500; // ms, time until fade-out starts
  const HIDE_DELAY = 3000; // ms, time until component is hidden
  const FADE_OUT_DURATION_MS = HIDE_DELAY - FADE_START_DELAY; // Duration of the fade-out effect

  useEffect(() => {
    let isMounted = true;

    // No logo URL provided, show the custom loader immediately
    if (isMounted) {
      setImageError(true);
      setImageLoaded(true);
    }

    // Timer to start the fade-out of the entire screen
    const timer1 = setTimeout(() => {
      if (isMounted) setFadeOut(true);
    }, FADE_START_DELAY);

    // Timer to hide the component completely and call onFinish
    const timer2 = setTimeout(() => {
      if (isMounted) {
        setShow(false);
        onFinish?.();
      }
    }, HIDE_DELAY);

    // Cleanup function to clear timers if the component unmounts
    return () => {
      isMounted = false;
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]); // Dependencies for the useEffect hook

  // If show is false, render nothing
  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#12182b] transition-all ease-in-out ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ 
        transitionDuration: `${FADE_OUT_DURATION_MS}ms`,
      }}
    >
      <div className={`transform transition-transform duration-1000 ${
        fadeOut ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
      }`}>
        {imageLoaded && (
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10">
            <Loader className="w-16 h-16" />
          </div>
        )}
      </div>
    </div>
  );
}