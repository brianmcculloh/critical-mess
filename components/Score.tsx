"use client";

import React, { useState, useEffect, useRef } from "react";
import FloatingText from "@/components/FloatingText";
import { Popcorn, ThumbsUp } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// ✅ Tomato icon that matches Lucide's line style
const TomatoIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.5"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 2c0 1-1 3-4 3 2 0 4 1 4 3 0-2 2-3 4-3-3 0-4-2-4-3zM5 8c-1 1-3 5-1 9s7 5 12 3 7-6 5-10c-2-4-7-4-9-3-2-1-7-1-9 3z"
    />
  </svg>
);

interface ScoreProps {
  label: string;
  field: string;
  value: number | null | undefined;
  editingField?: string | null;
  setEditingField?: (field: string | null) => void;
  setTempValue?: (value: string) => void;
  saveRating: (field: string, value: number) => Promise<void>;
  isEditable?: boolean;
  forceEditable?: boolean;
  disabled?: boolean;
}

const Score: React.FC<ScoreProps> = ({
  label,
  field,
  value,
  editingField,
  setEditingField,
  setTempValue,
  saveRating,
  isEditable = false,
  forceEditable = false,
  disabled = false,
}) => {
  const [localValue, setLocalValue] = useState<string>(value?.toString() ?? "");
  const [originalValue, setOriginalValue] = useState<string>(value?.toString() ?? "");
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingField === field) {
      setLocalValue(value?.toString() ?? "");
      setOriginalValue(value?.toString() ?? "");
    }
    if (editingField === field && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingField, field, value]);

  // Automatically hide the alert after 4 seconds
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  const handleSave = async () => {
    const numericValue = Number(localValue);
    if (
      localValue !== originalValue &&
      localValue.trim() !== "" &&
      !isNaN(numericValue) &&
      numericValue >= 0 &&
      numericValue <= 100
    ) {
      await saveRating(field, numericValue);
      // Reset and trigger the animations/notifications
      setShowFeedback(false);
      setTimeout(() => {
        setShowFeedback(true); // triggers FloatingText animation
        setShowAlert(true); // shows the bottom-right alert
      }, 0);
    }
    if (setEditingField) setEditingField(null);
  };

  // ✅ Determine dynamic color based on score value
  const getColorClass = () => {
    if (value === null || value === undefined) return "text-default";
    return value < 60 ? "text-rotten" : "text-fresh";
  };

  // ✅ Determine text size based on score type
  const getTextSizeClass = () => {
    return label.toLowerCase().includes("popcorn") || label.toLowerCase().includes("tomato")
      ? "text-2xl"
      : "text-base";
  };

  // ✅ Determine bottom offset based on score type
  const getBottomClass = () => {
    return label.toLowerCase().includes("popcorn") || label.toLowerCase().includes("tomato")
      ? "-bottom-2"
      : "bottom-0";
  };

  // ✅ Define tooltip text based on score type
  const tooltipText = label.toLowerCase().includes("popcorn")
    ? "Rotten Tomatoes Popcornmeter™ Score"
    : label.toLowerCase().includes("tomato")
    ? "Rotten Tomatoes Tomatometer™ Score"
    : label.toLowerCase().includes("you")
    ? "Tell us your rating out of 100!"
    : `Score for ${label}`;

  if (disabled) {
    return (
      <div className="flex-1 relative flex flex-col items-center justify-center">
        <div className="flex items-center gap-2">
          {label.toLowerCase().includes("popcorn") ? (
            <>
              <Popcorn className={`w-8 h-8 ${getColorClass()}`} />
              <span className="sr-only">Popcornmeter Score</span>
            </>
          ) : label.toLowerCase().includes("tomato") ? (
            <>
              <TomatoIcon className={`w-8 h-8 ${getColorClass()}`} />
              <span className="sr-only">Tomatometer Score</span>
            </>
          ) : (
            <span className="font-semibold">{label}</span>
          )}
        </div>
        <div className={`font-bold transition ${getTextSizeClass()} ${getColorClass()}`}>
          {value !== null ? (
            <span>{value}%</span>
          ) : (
            <span className="text-black/40 dark:text-white/40 font-normal">n/a</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex-1 relative flex flex-col items-center justify-center">
              <div className="flex items-center gap-2">
                {label.toLowerCase().includes("popcorn") ? (
                  <>
                    <Popcorn className={`w-8 h-8 ${getColorClass()}`} />
                    <span className="sr-only">Popcornmeter Score</span>
                  </>
                ) : label.toLowerCase().includes("tomato") ? (
                  <>
                    <TomatoIcon className={`w-8 h-8 ${getColorClass()}`} />
                    <span className="sr-only">Tomatometer Score</span>
                  </>
                ) : (
                  <span className="font-semibold">{label}</span>
                )}
              </div>

              {(isEditable || forceEditable) && editingField === field ? (
                <>
                  <span className="font-normal flex text-transparent bg-clip-text bg-gradient-to-r from-gray-500 via-white to-gray-500 bg-[length:200%] animate-shimmer">
                    add
                  </span>

                  <input
                    ref={inputRef}
                    type="text"
                    className={`border w-12 absolute font-bold ${getBottomClass()} left-1/2 -translate-x-1/2 rounded px-2 py-0 text-center ${getTextSizeClass()} ${getColorClass()} focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-white`}
                    value={localValue}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      // Allow only digits and empty string
                      if (/^\d*$/.test(inputValue)) {
                        const numericValue = Number(inputValue);
                        if (numericValue <= 100) {
                          setLocalValue(inputValue);
                        }
                      }
                    }}
                    onBlur={handleSave}
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    autoFocus
                  />
                </>
              ) : (
                <div
                  onClick={() => {
                    if ((isEditable || forceEditable) && setEditingField && setTempValue) {
                      setEditingField(field);
                      setTempValue(value?.toString() ?? "");
                      setLocalValue(value?.toString() ?? "");
                      setOriginalValue(value?.toString() ?? "");
                    }
                  }}
                  className={`font-bold transition ${getTextSizeClass()} ${isEditable || forceEditable ? "cursor-pointer" : ""}`}
                >
                  {value !== null ? (
                    <span className={`${isEditable || forceEditable ? "hover:text-white transition" : ""} ${getColorClass()}`}>
                      {value}%
                    </span>
                  ) : isEditable || forceEditable ? (
                    <span className="font-normal text-transparent bg-clip-text bg-gradient-to-r from-black via-[#ebb433] to-black bg-[length:200%] animate-shimmer dark:from-white dark:via-[#ebb433] dark:to-white">
                      add
                    </span>
                  ) : (
                    <span className="text-black/40 dark:text-white/40 font-normal">n/a</span>
                  )}
                </div>
              )}

              <FloatingText
                show={showFeedback}
                message="Saved!"
                onComplete={() => setShowFeedback(false)}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-black text-white text-xs rounded-lg px-3 py-2 shadow-lg">
            <span>{tooltipText}</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Bottom-right notification toast – controlled by showAlert */}
      {showAlert && (
        <div className="fixed bottom-4 right-4 rounded-lg shadow-lg z-50">
          <Alert className="shadow-lg bg-accent">
            <ThumbsUp className="absolute left-3 top-1/2 transform w-5 h-5" />
            <AlertTitle>Saved!</AlertTitle>
            <AlertDescription>Score updated</AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
};

export default Score;
