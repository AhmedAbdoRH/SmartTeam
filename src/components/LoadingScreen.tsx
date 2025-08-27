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
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[#232526] to-[#414345] transition-opacity ease-in-out ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ transitionDuration: `${FADE_OUT_DURATION_MS}ms` }}
    >
      {imageLoaded && (
        <Loader />
      )}
    </div>
  );
}