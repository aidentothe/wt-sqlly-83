"use client";
import { useState, useEffect, useCallback } from "react";
import { splashes } from "@/data/splashes";

interface Splash {
  text: string;
  style: React.CSSProperties;
}

const DISPLAY_DURATION = 3000; // 3 seconds
const FADE_DURATION = 1000;    // 1 second (must match CSS transition)
const DELAY_BETWEEN_SPLASHES = 5000; // 5 seconds

export default function SplashText() {
  const [currentSplash, setCurrentSplash] = useState<Splash | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showNewSplash = useCallback(() => {
    const randomText = splashes[Math.floor(Math.random() * splashes.length)];
    const randomTop = Math.random() * 10 + 5; // 5% to 15%
    const randomLeft = Math.random() * 35 + 5; // 5% to 40%

    setCurrentSplash({
      text: randomText,
      style: {
        top: `${randomTop}%`,
        left: `${randomLeft}%`,
      },
    });
    setIsVisible(true);
  }, []);

  useEffect(() => {
    showNewSplash(); // Initial splash
  }, [showNewSplash]);

  useEffect(() => {
    let displayTimer: NodeJS.Timeout;
    let delayTimer: NodeJS.Timeout;

    if (isVisible && currentSplash) {
      // Timer to start fade out
      displayTimer = setTimeout(() => {
        setIsVisible(false);
      }, DISPLAY_DURATION);
    } else if (!isVisible && currentSplash) {
      // Timer for delay after fade-out, then show new splash
      // Total time for current splash to disappear = DISPLAY_DURATION + FADE_DURATION
      delayTimer = setTimeout(() => {
        showNewSplash();
      }, DELAY_BETWEEN_SPLASHES + FADE_DURATION); // Wait for fade to complete, then 5s delay
    }

    return () => {
      clearTimeout(displayTimer);
      clearTimeout(delayTimer);
    };
  }, [isVisible, currentSplash, showNewSplash]);

  if (!currentSplash) {
    return null; // Don't render anything until the first splash is ready
  }

  return (
    <span
      style={{
        ...currentSplash.style,
        transition: `opacity ${FADE_DURATION / 1000}s ease-in-out`,
        opacity: isVisible ? 1 : 0,
      }}
      className="
        select-none pointer-events-none
        fixed /* Using fixed positioning with % top/left */
        font-bold italic text-[clamp(20px,2.6vw,38px)]
        text-yellow-300
        drop-shadow-[0_2px_2px_rgba(0,0,0,0.45)]
        -rotate-[6deg]
        z-10
      "
    >
      {currentSplash.text}
    </span>
  );
} 