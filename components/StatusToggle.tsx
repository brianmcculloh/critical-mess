// components/StatusToggle.tsx

"use client";

import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface StatusToggleProps {
  status: "episode" | "queue";
  onToggle: (status: "episode" | "queue") => void;
}

const StatusToggle: React.FC<StatusToggleProps> = ({ status, onToggle }) => {
  return (
    <div className="flex items-center gap-1 xs:gap-2">
      <Label htmlFor="status-toggle" className="text-sm font-medium">
        Queue
      </Label>
      <Switch
        id="status-toggle"
        checked={status === "episode"} // ✅ "Episode" is ON by default
        onCheckedChange={(checked) => onToggle(checked ? "episode" : "queue")}
        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300 
                   transition-colors border border-gray-300 data-[state=checked]:border-primary
                   [&>span]:bg-white [&>span]:transition-transform 
                   [&>span]:translate-x-0 data-[state=checked]:[&>span]:translate-x-4
                   dark:data-[state=unchecked]:bg-accent dark:border-accent dark:[&>span]:bg-black"
      />
      <Label className="text-sm font-medium"><span className="block xs:hidden">Ep.</span><span className="hidden xs:block">Episodes</span></Label>
    </div>
  );
};

export default StatusToggle;
