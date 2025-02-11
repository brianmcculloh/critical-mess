import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCheck } from "lucide-react";

interface FloatingTextProps {
  message?: string;
  icon?: React.ReactNode;
  show: boolean;
  onComplete?: () => void;
}

const FloatingText: React.FC<FloatingTextProps> = ({
  message = "Saved!",
  icon = <CheckCheck className="w-5 h-5" />,
  show,
  onComplete,
}) => {
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    if (show) setTrigger((prev) => prev + 1);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={trigger}
          initial={{ opacity: 1, y: 0, x: 0 }}
          animate={{ opacity: 0, y: -5, x: 0 }}
          exit={{ opacity: 0, y: -5, x: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute -top-2 flex items-center gap-2 p-1 rounded-md bg-white dark:bg-black shadow-md text-sm z-50 pointer-events-none"
          onAnimationComplete={() => onComplete && onComplete()}
        >
          {icon}
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingText;