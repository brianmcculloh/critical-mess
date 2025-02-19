"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ChevronDown, ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";


const SORT_OPTIONS = [
  { label: "Date Added", value: "created_at" },
  { label: "Movie Year", value: "year" },
  { label: "Movie Title", value: "title" },
  { label: "Critic Score", value: "critic_rating" },
  { label: "Audience Score", value: "audience_rating" },
  { label: "Average User Score", value: "avg_user_rating" },
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
}

const Sorting: React.FC<SortingProps> = ({ onSortChange }) => {
  const [selectedSort, setSelectedSort] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSortChange = (sortKey: string) => {
    setSelectedSort(sortKey);
    onSortChange(sortKey, sortOrder);
  };

  const handleSortOrderChange = (order: "asc" | "desc") => {
    setSortOrder(order);
    onSortChange(selectedSort, order);
  };

  return (
    <div className="flex items-center gap-2">
      {/* ShadCN-UI Dropdown for Sorting Options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 h-10">
            {SORT_OPTIONS.find(option => option.value === selectedSort)?.label}
            <ChevronDown className="w-4 h-4 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {SORT_OPTIONS.map((option) => (
            <DropdownMenuItem key={option.value} onClick={() => handleSortChange(option.value)}>
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Button Group for Sorting Order */}
      <div className="flex border rounded-md overflow-hidden">
        <Button
          onClick={() => handleSortOrderChange("desc")}
          className={sortOrder === "desc" ? "rounded-none bg-accent hover:bg-accent" : "rounded-none bg-background hover:bg-accent"}
        >
          <ArrowDownWideNarrow className="w-5 h-5 text-foreground" />
        </Button>
        <Button
          onClick={() => handleSortOrderChange("asc")}
          className={sortOrder === "asc" ? "rounded-none bg-accent hover:bg-accent" : "rounded-none bg-background hover:bg-accent"}
        >
          <ArrowUpNarrowWide className="w-5 h-5 text-foreground" />
        </Button>
      </div>
    </div>
  );
};

export default Sorting;
