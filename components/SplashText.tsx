"use client";
import { useMemo, useState, useEffect } from "react";
import { splashes } from "@/data/splashes";

export default function SplashText() {
  const [visible, setVisible] = useState(true);

  const text = useMemo(
    () => splashes[Math.floor(Math.random() * splashes.length)],
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <span
      style={{
        transition: 'opacity 1s ease-in-out',
        opacity: visible ? 1 : 0,
      }}
      className="
        select-none pointer-events-none
        fixed left-6 top-6 
        font-bold italic text-[clamp(20px,2.6vw,38px)]
        text-yellow-300
        drop-shadow-[0_2px_2px_rgba(0,0,0,0.45)]
        -rotate-[6deg]
        z-10 /* Ensure it's above background but potentially below other UI */
      "
    >
      {text}
    </span>
  );
} 