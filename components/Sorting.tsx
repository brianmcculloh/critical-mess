"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Check,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

const SORT_OPTIONS = [
  { label: "Episode", value: "episode" },
  { label: "Movie Year", value: "year" },
  { label: "Movie Title", value: "title" },
  { label: "Tomatometer", value: "critic_rating" },
  { label: "Popcornmeter", value: "audience_rating" },
  { label: "Score Gap", value: "disparity" },
  { label: "User Score", value: "avg_user_rating" },
  { label: "Nick's Score", value: "nick_rating" },
  { label: "Brian's Score", value: "brian_rating" },
  { label: "Gris's Score", value: "gris_rating" },
  { label: "Ben's Score", value: "ben_rating" },
  { label: "Nick's Heat Meter", value: "nick_heat" },
  { label: "Brian's Heat Meter", value: "brian_heat" },
  { label: "Gris's Heat Meter", value: "gris_heat" },
  { label: "Ben's Heat Meter", value: "ben_heat" },
];

interface SortingProps {
  onSortChange: (sortKey: string, sortOrder: "asc" | "desc") => void;
  currentSortKey: string;
  currentSortOrder: "asc" | "desc";
}

const Sorting: React.FC<SortingProps> = ({
  onSortChange,
  currentSortKey,
  currentSortOrder,
}) => {
  const [selectedSort, setSelectedSort] = useState<string>(currentSortKey);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(currentSortOrder);

  useEffect(() => {
    setSelectedSort(currentSortKey);
    setSortOrder(currentSortOrder);
  }, [currentSortKey, currentSortOrder]);

  const handleSortChange = (sortKey: string) => {
    setSelectedSort(sortKey);
    onSortChange(sortKey, sortOrder);
  };

  const handleSortOrderChange = (order: "asc" | "desc") => {
    setSortOrder(order);
    onSortChange(selectedSort, order);
  };

  return (
    <div className="flex items-center gap-1">
      {/* ✅ Dropdown for Sorting Options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="relative inline-block">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 h-10">
                    {SORT_OPTIONS.find((option) => option.value === selectedSort)?.label}
                    <ChevronDown className="w-4 h-4 opacity-70" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-black text-white text-xs rounded-lg px-3 py-2 shadow-lg">
                  <span>Sort By</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {SORT_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleSortChange(option.value)}
              className={`flex items-center justify-between ${
                selectedSort === option.value ? "bg-accent text-white font-semibold" : ""
              }`}
            >
              {option.label}
              {selectedSort === option.value && <Check className="w-4 h-4 ml-2" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {/* ✅ Sorting Order Controls */}
      <div className="flex border rounded-md overflow-hidden">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => handleSortOrderChange("desc")}
                className={
                  sortOrder === "desc"
                    ? "rounded-none bg-accent hover:bg-accent text-white px-2 xs:px-4"
                    : "rounded-none bg-background hover:bg-accent px-3 xs:px-4"
                }
              >
                <ArrowDownWideNarrow className="w-5 h-5 text-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-black">
              <span>Highest First</span>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => handleSortOrderChange("asc")}
                className={
                  sortOrder === "asc"
                    ? "rounded-none bg-accent hover:bg-accent text-white px-2 xs:px-4"
                    : "rounded-none bg-background hover:bg-accent px-3 xs:px-4"
                }
              >
                <ArrowUpNarrowWide className="w-5 h-5 text-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-black">
              <span>Lowest First</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default Sorting;
