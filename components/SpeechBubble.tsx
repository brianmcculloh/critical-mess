"use client";

import React from "react";

interface SpeechBubbleProps {
  message: string;
  className?: string;
  arrowDirection?: "top" | "left" | "bottom" | "right";
}

const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  message,
  className = "",
  arrowDirection = "top",
}) => {
  const getArrow = (direction: "top" | "left" | "bottom" | "right") => {
    switch (direction) {
      case "top":
        return (
          <div className="absolute top-[5px] left-1/2 transform -translate-x-1/2 -translate-y-full">
            <div className="w-0 h-0 border-l-[26px] border-r-[26px] border-b-[26px] border-transparent border-b-black dark:border-b-white"></div>
          </div>
        );
      case "bottom":
        return (
          <div className="absolute bottom-[5px] left-1/2 transform -translate-x-1/2 translate-y-full">
            <div className="w-0 h-0 border-l-[26px] border-r-[26px] border-t-[26px] border-transparent border-t-black dark:border-t-white"></div>
          </div>
        );
      case "left":
        return (
          <div className="absolute left-[5px] top-1/2 transform -translate-x-full -translate-y-1/2">
            <div className="w-0 h-0 border-t-[26px] border-b-[26px] border-r-[26px] border-transparent border-r-black dark:border-r-white"></div>
          </div>
        );
      case "right":
        return (
          <div className="absolute right-[5px] top-1/2 transform translate-x-full -translate-y-1/2">
            <div className="w-0 h-0 border-t-[26px] border-b-[26px] border-l-[26px] border-transparent border-l-black dark:border-l-white"></div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {getArrow(arrowDirection)}
      <div className="bg-black text-white dark:bg-white dark:text-black text-lg rounded-lg px-4 py-3 shadow-lg font-bold">
        {message}
      </div>
    </div>
  );
};

export default SpeechBubble;
