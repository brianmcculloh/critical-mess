import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import hotPocketData, { HotPocketData, Ingredient } from "./hotPocketData";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { storeHotPocketCreation, getHotPocketComboCount, getTotalHotPocketCount } from "@/lib/hotPocketDb";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { PATRON_PAYWALL_ENABLED } from "@/lib/featureFlags";

const categories = [
  { key: "breakfast", label: "Breakfast" },
  { key: "dinner", label: "Dinner" },
  { key: "dessert", label: "Dessert" },
];

const bandNames = ["Base", "Modifier", "Crust", "Seasoning"];
const bandLabels: Record<string, string> = {
  Base: "Hot Pocket",
  Modifier: "Special Ingredient",
  Crust: "Special Crust",
  Seasoning: "Special Seasoning"
};

// Weighted random selection utility
function weightedRandom<T extends { weight: number }>(items: T[]): number {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let rand = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    rand -= items[i].weight;
    if (rand <= 0) return i;
  }
  return items.length - 1;
}

// For seasoning style
const seasoningStyles = [
  { label: "dusted", weight: 100 },
  { label: "seasoned", weight: 80 },
  { label: "double-dusted", weight: 20 },
  { label: "blasted", weight: 20 },
];

// Extend Ingredient type for hit marking
// @ts-ignore
interface HitIngredient extends Ingredient { isHit?: boolean; }

// Utility to darken a hex color by a given factor (0-1)
function darkenHexColor(hex: string, factor: number) {
  // Remove # if present
  hex = hex.replace('#', '');
  // Parse r, g, b
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  // Apply factor
  r = Math.round(r * factor);
  g = Math.round(g * factor);
  b = Math.round(b * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

// Utility to lighten a hex color by a given factor (0-1)
function lightenHexColor(hex: string, factor: number) {
  hex = hex.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  // Blend with white
  r = Math.round(r + (255 - r) * factor);
  g = Math.round(g + (255 - g) * factor);
  b = Math.round(b + (255 - b) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

// Utility to blend an RGB color string with black by a given factor (0-1)
function darkenRgbColor(rgb: string, factor: number) {
  // rgb(r, g, b)
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return rgb;
  let r = parseInt(match[1], 10);
  let g = parseInt(match[2], 10);
  let b = parseInt(match[3], 10);
  r = Math.round(r * (1 - factor));
  g = Math.round(g * (1 - factor));
  b = Math.round(b * (1 - factor));
  return `rgb(${r}, ${g}, ${b})`;
}

// Utility to blend a color (hex or rgb) with white by a given factor (0-1)
function blendWithWhite(color: string, factor: number) {
  let r, g, b;
  if (color.startsWith('#')) {
    color = color.replace('#', '');
    r = parseInt(color.substring(0, 2), 16);
    g = parseInt(color.substring(2, 4), 16);
    b = parseInt(color.substring(4, 6), 16);
  } else {
    // rgb(r, g, b)
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return color;
    r = parseInt(match[1], 10);
    g = parseInt(match[2], 10);
    b = parseInt(match[3], 10);
  }
  r = Math.round(r + (255 - r) * factor);
  g = Math.round(g + (255 - g) * factor);
  b = Math.round(b + (255 - b) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

// Standalone Reel System Component - Completely isolated
const ReelSystem = memo(function ReelSystem({ 
  categoryData, 
  onBakeClick,
  onNext,
  onBakeStart,
  resolvedTheme,
  isCompact,
  isMobile,
  lockTogglesDisabled,
  locked,
  setLocked,
  categoryColor
}: { 
  categoryData: any;
  onBakeClick: (hitItems: HitIngredient[], seasoningStyle: string) => void;
  onNext: () => void;
  onBakeStart: () => void;
  resolvedTheme: string | undefined;
  isCompact: boolean;
  isMobile: boolean;
  lockTogglesDisabled: boolean;
  locked: boolean[];
  setLocked: React.Dispatch<React.SetStateAction<boolean[]>>;
  categoryColor?: string;
}) {
  const outerBorderWidth = isCompact ? 2 : 4;

  const handleStartOver = () => {
    // Clear the modal timer if it exists
    if (modalTimerRef.current) {
      clearTimeout(modalTimerRef.current);
      modalTimerRef.current = null;
    }
    onNext();
  };

  
  const [selectedIndices, setSelectedIndices] = useState<number[]>([0, 0, 0, 0]);
  const [reelItemsList, setReelItemsList] = useState<HitIngredient[][]>([[], [], [], []]);
  const [isBaking, setIsBaking] = useState(false);
  const reelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isAnimationCompleteRef = useRef(false);
  const modalTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to shuffle an array
  const shuffleArray = (array: Ingredient[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Initialize reels when category data changes
  useEffect(() => {
    if (categoryData) {
  
      const newReelItemsList: Ingredient[][] = bandNames.map((band) => {
        const bandKey = band.toLowerCase() as keyof HotPocketData["breakfast"];
        const allItems = categoryData[bandKey];
        let reelItems: Ingredient[] = [];
        for (let i = 0; i < 5; i++) {
          const shuffledItems = shuffleArray(allItems);
          reelItems = reelItems.concat(shuffledItems);
        }
        return reelItems;
      });
      setReelItemsList(newReelItemsList);
      // Reset baking state when category changes
      setIsBaking(false);
    }
  }, [categoryData]);

  // Memoized Reel component
  const Reel = memo(function Reel({ items, selectedIdx, greyed, bandName, reelIndex, resolvedTheme, isCompact, isHorizontal, locked, categoryColor }: { 
    items: HitIngredient[];
    selectedIdx: number; 
    greyed: boolean; 
    bandName: string; 
    reelIndex: number;
    resolvedTheme: string | undefined;
    isCompact: boolean;
    isHorizontal: boolean;
    locked: boolean;
    categoryColor?: string;
  }) {
    let borderColor = 'hsl(var(--border))';
    if (bandName === 'Base' && categoryColor) {
      // Always use the main category color for the first reel border
      if (categoryColor === '#d5693f') borderColor = '#d5693f'; // breakfast
      else if (categoryColor === '#b92638') borderColor = '#b92638'; // dinner
      else if (categoryColor === '#6a3253') borderColor = '#6a3253'; // dessert
      else borderColor = categoryColor;
    } else {
      borderColor = locked ? '#fbbf24' : 'hsl(var(--border))';
    }
    const isLightMode = resolvedTheme === "light";
    const outerBorderWidthLocal = isCompact ? 2 : 4;
    const itemWidth = isHorizontal ? 80 : (isCompact ? 140 : 200);
    const itemHeight = isHorizontal ? 80 : (isCompact ? 140 : 200);
    const outerReelHeight = isHorizontal ? itemHeight : (isCompact ? 420 : 535);
    const itemFont = isHorizontal
      ? { fontSize: '.575rem', lineHeight: '.625rem' }
      : (isCompact ? { fontSize: '.8rem', lineHeight: '1.2rem' } : {});
    return (
      <div
        className={`relative flex items-center justify-center rounded-xl ${isLightMode ? 'bg-white' : 'bg-black'} ${isHorizontal ? 'w-full' : 'w-56 min-w-56 max-w-56'}`}
        style={{
          height: outerReelHeight,
          border: `${outerBorderWidthLocal}px solid ${borderColor}`,
          ...(isHorizontal ? {} : (isCompact ? { width: 172, minWidth: 172, maxWidth: 172 } : {})),
        }}
      >
        {/* edge gradients */}
        {!isHorizontal && (
          <>
        <div className="pointer-events-none absolute top-0 left-0 w-full z-20 rounded-t-[10px]" style={{height: '75px', background: isLightMode ? 'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)' : 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)'}} />
        <div className="pointer-events-none absolute bottom-0 left-0 w-full z-20 rounded-b-[10px]" style={{height: '75px', background: isLightMode ? 'linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)' : 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)'}} />
          </>
        )}
        {isHorizontal && (
          <>
            <div className="pointer-events-none absolute left-0 top-0 h-full z-20 rounded-l-[10px]" style={{width: '30px', background: isLightMode ? 'linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)' : 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)'}} />
            <div className="pointer-events-none absolute right-0 top-0 h-full z-20 rounded-r-[10px]" style={{width: '30px', background: isLightMode ? 'linear-gradient(to left, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)' : 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)'}} />
          </>
        )}
        <div 
          ref={(el) => { 
            reelRefs.current[reelIndex] = el; 

          }}
          className={`relative z-10 w-full h-full overflow-hidden rounded-[10px] ${isHorizontal ? 'overflow-x-hidden' : ''}`}
        >
          <div className={`${isHorizontal ? 'flex flex-row' : 'w-full'}`}>
            {items.map((item, idx) => {
              let backgroundColor = isLightMode ? 'white' : 'black';
              if (bandName === 'Base' && categoryColor) {
                  if (isLightMode) {
                    // Use new exact colors for light mode
                    if (categoryColor === '#d5693f') backgroundColor = '#ffad8c'; // breakfast
                    else if (categoryColor === '#b92638') backgroundColor = '#ffb3bd'; // dinner
                    else if (categoryColor === '#6a3253') backgroundColor = '#ffc2e6'; // dessert
                    else backgroundColor = categoryColor;
                  } else {
                    // Darken by 50% in dark mode, then decrease luminance by 30%
                    let darkened = darkenHexColor(categoryColor, 0.5);
                    backgroundColor = darkenRgbColor(darkened, 0.3);
                  }
                }
              // Increase luminance of all reel backgrounds by 40%, but only in light mode
              if (isLightMode) {
                backgroundColor = blendWithWhite(backgroundColor, 0.4);
              }
              return (
                <div
                  key={`${item.name}-${idx}`}
                  className={`flex flex-col items-center justify-center ${isHorizontal ? '' : 'w-full'} border-dashed text-center`}
                  style={{
                    minHeight: itemHeight,
                    maxHeight: itemHeight,
                    height: itemHeight,
                    backgroundColor,
                    borderColor:
                      isLightMode
                        ? 'rgba(0,0,0,0.2)'
                        : 'rgba(255,255,255,0.305)',
                    borderStyle: 'dashed',
                    ...(isHorizontal ? { borderWidth: '0 2px 0 0', minWidth: itemWidth, width: itemWidth, maxWidth: itemWidth, padding: '4px 6px' } : { borderWidth: '0 0 2px 0', padding: '12px 16px' })
                  }}
                >
                  <div className="rounded mb-1 flex items-center justify-center mx-auto" style={{ width: isHorizontal ? 32 : 64, height: isHorizontal ? 32 : 64 }}>
                    {(() => {
                      let isDimmed = !item.isHit;
                      if (item.isHit) {
                        if (
                          (bandName === 'Base' && item.name === 'None') ||
                          (bandName === 'Modifier' && item.name === 'None') ||
                          (bandName === 'Crust' && (item.name === 'None' || item.name === 'Original')) ||
                          (bandName === 'Seasoning' && item.name === 'None')
                        ) {
                          isDimmed = true;
                        }
                      }
                      const opacityClass = isDimmed ? 'opacity-35' : 'opacity-100';
                      if (bandName === 'Base') {
                        return (
                          <Image 
                            src={isLightMode ? "/hotpocket-lightmode.png" : "/hotpocket.png"}
                            alt="Base" 
                            width={isHorizontal ? 32 : 64} 
                            height={isHorizontal ? 32 : 64} 
                            className={`object-contain ${opacityClass}`}
                          />
                        );
                      } else if (bandName === 'Modifier') {
                        return (
                          <Image 
                            src={isLightMode ? "/modifier-lightmode.png" : "/modifier.png"}
                            alt="Modifier" 
                            width={isHorizontal ? 32 : 64} 
                            height={isHorizontal ? 32 : 64} 
                            className={`object-contain ${opacityClass}`}
                          />
                        );
                      } else if (bandName === 'Crust') {
                        return (
                          <Image 
                            src={isLightMode ? "/crust-lightmode.png" : "/crust.png"}
                            alt="Crust" 
                            width={isHorizontal ? 32 : 64} 
                            height={isHorizontal ? 32 : 64} 
                            className={`object-contain ${opacityClass}`}
                          />
                        );
                      } else if (bandName === 'Seasoning') {
                        return (
                          <Image 
                            src={isLightMode ? "/seasoning-lightmode.png" : "/seasoning.png"}
                            alt="Seasoning" 
                            width={isHorizontal ? 32 : 64} 
                            height={isHorizontal ? 32 : 64} 
                            className={`object-contain ${opacityClass}`}
                          />
                        );
                      } else {
                        return <span className="text-accent-foreground">?</span>;
                      }
                    })()}
                  </div>
                  <span
                    className={`text-base ${item.isHit && item.name !== 'None' && !(reelIndex === 2 && item.name === 'Original') ? (isLightMode ? 'text-black font-bold' : 'text-white font-bold') : 'text-card-foreground opacity-50'}`}
                    style={itemFont}
                  >
                    {item?.name || ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  });

  const handleBake = () => {
    // 1) User clicks bake
    if (onBakeStart) onBakeStart();
    setIsBaking(true);

    // 2) System determines weighted random items
    const newHitItems: HitIngredient[] = [];
    bandNames.forEach((band, i) => {
      const bandKey = band.toLowerCase() as keyof HotPocketData["breakfast"];
      const allItems = categoryData[bandKey];
      // For Modifier, Crust, Seasoning, check lock
      if ((i === 1 || i === 2 || i === 3) && locked[i]) {
        // Filter out 'None' (and 'Original' for Crust)
        let filteredItems = allItems.filter((item: Ingredient) => item.name !== 'None');
        if (i === 2) filteredItems = filteredItems.filter((item: Ingredient) => item.name !== 'Original');
        // If all filtered out, fallback to allItems
        const hitIdx = filteredItems.length > 0 ? weightedRandom(filteredItems) : weightedRandom(allItems);
        const hitItem = (filteredItems.length > 0 ? filteredItems : allItems)[hitIdx];
        newHitItems[i] = { ...hitItem, isHit: true };
      } else {
        const hitIdx = weightedRandom(allItems);
        const hitItem = allItems[hitIdx];
        newHitItems[i] = { ...hitItem, isHit: true };
      }
    });

    // Set seasoning style based on the hitting seasoning
    const seasoningHit = newHitItems[3]; // Seasoning is the 4th reel (index 3)
    let seasoningStyle = "";
    if (seasoningHit && seasoningHit.name !== "None") {
      const styleIdx = weightedRandom(seasoningStyles);
      seasoningStyle = seasoningStyles[styleIdx].label;
    }

    // 3) System adds the items to the results modal (which is hidden)

    // 4) System inserts those items to the second to last slot of the reels
    setReelItemsList((prev) => {
      const newList = prev.map((items, i) => {
        const newItems = [...items] as HitIngredient[];
        newItems.splice(newItems.length - 1, 0, newHitItems[i]);
        return newItems;
      });
      return newList;
    });

    // 5) System does the reel scrolling
    const startTime = Date.now();
    const duration = 3000; // 3 seconds
    const animateScroll = (isCompactArg: boolean, borderWidthArg: number) => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      reelRefs.current.forEach((reelRef, index) => {
        if (reelRef) {
          const maxScroll = isMobile ? (reelRef.scrollWidth - reelRef.clientWidth) : (reelRef.scrollHeight - reelRef.clientHeight);
          // Offset by 40px for normal, 5px for compact (fine-tuned for center alignment)
          const offset = isCompactArg ? 5 : 40;
          const targetScroll = maxScroll - offset;
          const currentScroll = targetScroll * easeOutCubic;
          if (isMobile) {
            reelRef.scrollLeft = currentScroll;
          } else {
          reelRef.scrollTop = currentScroll;
          }
        }
      });
      if (progress < 1) {
        requestAnimationFrame(() => animateScroll(isCompactArg, borderWidthArg));
      } else {
        isAnimationCompleteRef.current = true;
        // Apply yellow borders directly to the DOM without re-rendering
        reelRefs.current.forEach((reelRef, index) => {
          if (reelRef) {
            const reelContainer = reelRef.parentElement;
            if (reelContainer) {
              // Check if the hit item is "None" for this reel (or "Original" for crust)
              const hitItem = newHitItems[index];
              const isCrustReel = index === 2; // Crust is the 3rd reel (index 2)
              const shouldNotHighlight = hitItem.name === 'None' || (isCrustReel && hitItem.name === 'Original');
              if (hitItem && !shouldNotHighlight) {
                // Fade in the yellow border
                reelContainer.style.transition = 'border-color 0.5s ease-in-out, box-shadow 0.5s ease-in-out';
                reelContainer.style.border = `${borderWidthArg}px solid #fbbf24`;
                reelContainer.style.boxShadow = '0 0 10px rgba(251, 191, 36, 0.5)';
              } else {
                // Keep default border for "None" selections
                reelContainer.style.border = `${borderWidthArg}px solid hsl(var(--border))`;
                reelContainer.style.boxShadow = 'none';
              }
            }
          }
        });
      }
    };
    requestAnimationFrame(() => animateScroll(isCompact, outerBorderWidth));

    // 6) Exactly 4 seconds after the user clicks bake, the results modal should become visible
    modalTimerRef.current = setTimeout(() => {
      setTimeout(() => {
        onBakeClick(newHitItems, seasoningStyle);
      }, 500); // 0.5s delay after reels finish
    }, 4000);
  };

  return (
    <div className="flex flex-col gap-4 mt-6" style={isMobile ? { marginTop: 0 } : {}}>
      {!isMobile ? (
      <div className="relative flex flex-row justify-center items-stretch w-full">
        {/* Center line indicator - spans across entire panel behind reels */}
        <div className="pointer-events-none absolute z-0 h-0.5 bg-muted-foreground/60 w-full" style={{ top: 'calc(50% + 3px)', left: 0, right: 0, transform: 'translateY(-50%)' }} />
        {/* First Reel */}
        <div className="flex flex-col items-center rounded-lg min-h-[180px] text-card-foreground">
          <div
            className="font-bold mb-2 text-center"
            style={isCompact ? { fontSize: '0.75rem', lineHeight: '1rem' } : { fontSize: '1rem', lineHeight: '1.25rem' }}
          >
            {bandLabels[bandNames[0]]}
          </div>
          <Reel
            items={reelItemsList[0] as HitIngredient[]}
            selectedIdx={selectedIndices[0]}
            greyed={false}
            bandName={bandNames[0]}
            reelIndex={0}
            resolvedTheme={resolvedTheme}
            isCompact={isCompact}
              isHorizontal={false}
            locked={locked[0]}
            categoryColor={categoryColor}
          />
          <div className="flex flex-col items-center mt-2" style={{ height: isCompact ? 19 : 23 }} />
        </div>
        {/* Vertical Separator */}
        <div className="flex justify-center items-stretch mx-4">
          {/* For light mode, use black with 20% transparency; for dark mode, keep as is */}
          <div
            style={{
              minHeight: 320,
              alignSelf: 'stretch',
              width: '1px',
              background:
                resolvedTheme === 'light'
                  ? 'rgba(0,0,0,0.2)'
                  : 'rgba(255,255,255,0.47)',
            }}
          />
        </div>
        {/* Other Three Reels */}
        <div className="flex flex-row gap-5">
          {[1, 2, 3].map(i => {
            const band = bandNames[i];
            const bandKey = band.toLowerCase() as keyof HotPocketData["breakfast"];
            const bandData = categoryData![bandKey];
            const selectedIdx = selectedIndices[i];
            const isNone = band !== "Base" && bandData[selectedIdx].name === "None";
            return (
              <div
                key={band}
                className="flex flex-col items-center rounded-lg min-h-[180px] text-card-foreground"
              >
                <div
                  className="font-bold mb-2 text-center"
                  style={isCompact ? { fontSize: '0.75rem', lineHeight: '1rem' } : { fontSize: '1rem', lineHeight: '1.25rem' }}
                >
                  {bandLabels[band]}
                </div>
                <Reel
                  items={reelItemsList[i] as HitIngredient[]}
                  selectedIdx={selectedIndices[i]}
                  greyed={isNone}
                  bandName={band}
                  reelIndex={i}
                  resolvedTheme={resolvedTheme}
                  isCompact={isCompact}
                    isHorizontal={false}
                  locked={locked[i]}
                />
                <div className="flex flex-col items-center mt-2">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`lock-toggle-${i}`}
                            checked={locked[i]}
                            onCheckedChange={checked => setLocked(l => l.map((v, idx) => idx === i ? checked : v))}
                            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input border border-gray-300 dark:border-accent"
                            disabled={lockTogglesDisabled}
                          />
                          <Label htmlFor={`lock-toggle-${i}`} className="text-xs font-medium select-none text-muted-foreground dark:text-gray-300">
                            locked on
                          </Label>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-black">
                        <span>locked on reels increase their hit chances from ~20% to 100%</span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      ) : (
        <div className="w-full" style={{ position: 'relative', maxWidth: 'calc(100vw - 16px)', margin: '0 auto' }}>
          {/* Single vertical hit line behind all reels (mobile only) */}
          <div
            className="pointer-events-none absolute z-0"
            style={{
              top: 0,
              bottom: -20,
              left: `calc(100% - ${80 * 1.5}px)`,
              width: '2px',
              background: 'hsl(var(--primary) / 0.8)'
            }}
          />
          <div className="flex flex-col gap-4 w-full relative z-10">
            {[0,1,2,3].map(i => {
            const band = bandNames[i];
            const bandKey = band.toLowerCase() as keyof HotPocketData["breakfast"];
            const bandData = categoryData![bandKey];
            const selectedIdx = selectedIndices[i];
            const isNone = band !== "Base" && bandData[selectedIdx]?.name === "None";
            return (
              <div key={band} className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-left" style={{ fontSize: '.625rem', lineHeight: '.625rem' }}>{bandLabels[band]}</div>
                  {i > 0 && (
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`lock-toggle-${i}`}
                              checked={locked[i]}
                              onCheckedChange={checked => setLocked(l => l.map((v, idx) => idx === i ? checked : v))}
                              className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input border border-gray-300 dark:border-accent"
                              disabled={lockTogglesDisabled}
                            />
                            <Label htmlFor={`lock-toggle-${i}`} className="text-[10px] font-medium select-none text-muted-foreground dark:text-gray-300 leading-3">
                              locked on
                            </Label>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-black">
                          <span>locked on reels increase their hit chances from ~20% to 100%</span>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <div>
                  <Reel
                    items={reelItemsList[i] as HitIngredient[]}
                    selectedIdx={selectedIndices[i]}
                    greyed={isNone}
                    bandName={band}
                    reelIndex={i}
                    resolvedTheme={resolvedTheme}
                    isCompact={true}
                    isHorizontal={true}
                    locked={locked[i]}
                    categoryColor={i === 0 ? categoryColor : undefined}
                  />
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}
      <div className="flex gap-4 mt-2 justify-center">
        <Button
          className="bg-primary text-black hover:bg-primary/80 px-[22px] py-[18px]"
          onClick={handleBake}
          disabled={isBaking}
        >
          {isBaking ? "Baking..." : "Spin the reels and bake @350°"}
        </Button>
        <Button
          className="transition-colors bg-secondary hover:bg-secondary/70 text-black dark:text-white px-[22px] py-[18px]"
          onClick={handleStartOver}
        >
          Bake Another
        </Button>
      </div>
      {isMobile && <div style={{ height: 20 }} />}
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if categoryData, locked, or lockTogglesDisabled changes
  return (
    prevProps.categoryData === nextProps.categoryData &&
    prevProps.locked.join(',') === nextProps.locked.join(',') &&
    prevProps.lockTogglesDisabled === nextProps.lockTogglesDisabled
  );
});

const HotPocketGenerator: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const [patronLevel, setPatronLevel] = useState<number>(0);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  // Responsive: 991px and below
  const [isCompact, setIsCompact] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [comboCount, setComboCount] = useState<number | null>(null);
  const [totalBakes, setTotalBakes] = useState<number | null>(null);
  // Add lock toggles state here
  const [locked, setLocked] = useState([false, false, false, false]);
  const [lockTogglesDisabled, setLockTogglesDisabled] = useState(false);
  useEffect(() => {
    const check = () => {
      setIsCompact(window.innerWidth <= 991);
      setIsNarrow(window.innerWidth < 1180);
      setIsMobile(window.innerWidth <= 767);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  
  // Store hit results in a ref
  const hitItemsRef = useRef<HitIngredient[]>([]);
  const seasoningStyleRef = useRef<string>("");



  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setShowResult(false);
    setLockTogglesDisabled(false);
  };

  const handleNext = () => {
    setSelectedCategory(null);
    setShowResult(false);
    setLockTogglesDisabled(false);
  };

  const handleCloseResult = () => {
    setShowResult(false);
  };

  const handleBakeClick = async (hitItems: HitIngredient[], seasoningStyle: string) => {
    hitItemsRef.current = hitItems;
    seasoningStyleRef.current = seasoningStyle;
    // Extract combo details
    const base = hitItems[0]?.name || '';
    const modifier = hitItems[1]?.name || '';
    const crust = hitItems[2]?.name || '';
    const seasoning = hitItems[3]?.name || '';
    const category = selectedCategory || '';
    const user_id = undefined; // Set if you have user auth
    // 1. Store the creation
    await storeHotPocketCreation({
      category,
      base,
      modifier,
      crust,
      seasoning,
      seasoning_style: seasoningStyle,
      user_id,
    });
    // 2. Get the count of this combo
    const { count } = await getHotPocketComboCount({
      category,
      base,
      modifier,
      crust,
      seasoning,
      seasoning_style: seasoningStyle,
    });
    setComboCount(count);
    // Fetch total bakes
    const { count: totalCount } = await getTotalHotPocketCount();
    setTotalBakes(totalCount);
    setShowResult(true);
  };

  const handleBakeStart = () => {
    setLockTogglesDisabled(true);
  };

  const categoryData = selectedCategory ? hotPocketData[selectedCategory] : null;

  // In HotPocketGenerator, determine the category color
  const getCategoryColor = (category: string | null) => {
    if (category === 'breakfast') return '#d5693f';
    if (category === 'dinner') return '#b92638';
    if (category === 'dessert') return '#6a3253';
    return undefined;
  };

  // Result formatting
  function getResultText(hitItems: HitIngredient[], seasoningStyle: string) {
    if (!categoryData || hitItems.length === 0) return { parts: [], person: undefined };
    const [base, modifier, crust, seasoning] = hitItems;
    
    // Helper function to check if a word starts with a vowel
    const startsWithVowel = (word: string) => {
      const vowels = ['a', 'e', 'i', 'o', 'u'];
      return vowels.includes(word.toLowerCase().charAt(0));
    };
    
    const parts: { text: string; type: 'white' | 'primary' | 'seasoning' }[] = [];
    let person: string | undefined = undefined;
    
    // Base name (primary yellow)
    parts.push({ text: base.name.toUpperCase(), type: 'primary' });
    
    // Modifier
    if (modifier.name !== "None") {
      parts.push({ text: " with ", type: 'white' });
      parts.push({ text: modifier.name.toLowerCase(), type: 'primary' });
    }
    
    // Crust
    if (crust.name !== "None" && crust.name !== "Original") {
      const article = startsWithVowel(crust.name) ? "an" : "a";
      parts.push({ text: ` in ${article} `, type: 'white' });
      parts.push({ text: crust.name.toLowerCase(), type: 'primary' });
      parts.push({ text: " crust", type: 'primary' });
    }
    
    // Seasoning
    if (seasoning.name !== "None" && seasoningStyle) {
      const seasoningText = seasoningStyle.toLowerCase() === "blasted" ? "BLASTED" : seasoningStyle.toLowerCase();
      parts.push({ text: ` ${seasoningText} with `, type: 'seasoning' });
      parts.push({ text: seasoning.name.toLowerCase(), type: 'primary' });
      // If seasoning has a person property, add it
      if ((seasoning as any).person) {
        person = (seasoning as any).person;
      }
    }
    
    return { parts, person };
  }

  // Portal-based Results Modal
  const ResultsModal = () => {
    
    if (!showResult || !categoryData) return null;

    // Determine if light mode
    const isLightMode = resolvedTheme === "light";

    // Animation state for smooth entrance
    const [visible, setVisible] = useState(false);
    useEffect(() => {
      setVisible(true);
    }, []);

    return createPortal(
      <div
        className="fixed top-0 left-0 right-0 bottom-0 z-[9999] bg-black/50 pointer-events-auto pl-[100px] pr-[100px]"
        onClick={() => setShowResult(false)}
      >
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[10000] bg-background border rounded-2xl p-8 pt-8 text-center w-full pointer-events-auto overflow-y-auto overflow-x-hidden"
          style={window.innerWidth <= 991
            ? { width: '100vw', maxWidth: '100vw', top: 0, opacity: visible ? 1 : 0, transform: visible ? 'translate(-50%, 0)' : 'translate(-50%, 80px)', transition: 'opacity 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)', maxHeight: '100vh', overflowX: 'hidden' }
            : { maxWidth: '900px', top: 0, opacity: visible ? 1 : 0, transform: visible ? 'translate(-50%, 0)' : 'translate(-50%, 80px)', transition: 'opacity 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)', maxHeight: '100vh', overflowX: 'hidden' }
          }
          onClick={e => e.stopPropagation()}
        >
          {/* Close button as X in upper right corner */}
          <button
            onClick={e => { e.stopPropagation(); setShowResult(false); }}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors z-[10001]"
            aria-label="Close"
            tabIndex={0}
            style={{ pointerEvents: 'auto' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div className="flex justify-center mb-4">
            <Image 
              src={isLightMode ? "/hotpocket-lightmode.png" : "/hotpocket.png"}
              alt="Hot Pocket" 
              width={120} 
              height={120} 
              className="object-contain"
            />
          </div>
          <h2 className="font-bold mb-1" style={window.innerWidth <= 991 ? { fontSize: '22px', lineHeight: '26px' } : { fontSize: '29px', lineHeight: '33px' }}>Your Hot Pocket is ready!</h2>
          <div className="flex flex-col gap-6">
            <div className="font-bold mb-2" style={window.innerWidth <= 991 ? { fontSize: '1.5rem', lineHeight: '1.75rem' } : { fontSize: '1.875rem', lineHeight: '2.25rem' }}>
              <div>
                <span className={isLightMode ? "text-black" : "text-white"}>It's {getResultText(hitItemsRef.current, seasoningStyleRef.current).parts.length > 0 && getResultText(hitItemsRef.current, seasoningStyleRef.current).parts[0].text.toLowerCase().match(/^[aeiou]/) ? 'an ' : 'a '}</span>
                {getResultText(hitItemsRef.current, seasoningStyleRef.current).parts.map((part, index) => {
                  if (part.type === 'primary') {
                    return (
                      <span key={index} className="text-primary">
                        {index === 0 ? <span className="border-b-2 border-b-white inline-block">{part.text}*</span> : part.text}
                      </span>
                    );
                  } else if (part.type === 'seasoning') {
                    return (
                      <span key={index} className="text-[#b92638]">
                        {part.text}
                      </span>
                    );
                  } else {
                    return (
                      <span key={index} className={isLightMode ? "text-black" : "text-white"}>
                        {part.text}
                      </span>
                    );
                  }
                })}
                {/* Show person if present */}
                {(() => {
                  const result = getResultText(hitItemsRef.current, seasoningStyleRef.current);
                  if (result.person) {
                    return (
                      <span className={isLightMode ? "text-black" : "text-white"}> by {result.person}</span>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          <div className="text-base text-primary" style={window.innerWidth <= 767 ? { fontSize: '0.9375rem' } : { fontSize: '1.25rem' }}>
              *{hitItemsRef.current[0]?.ingredientList?.map(ingredient => ingredient.toLowerCase()).join(", ")}
            </div>
            {/* Combo count message moved here, above the Bake Another button */}
            {comboCount !== null && (
              <div
                className="mb-1"
                style={window.innerWidth <= 767 ? {
                  fontSize: '0.65625rem',
                  fontWeight: 'normal',
                  color: isLightMode ? 'black' : 'white',
                  opacity: 0.65,
                  transition: 'opacity 0.2s',
                } : {
                  fontSize: '0.875rem',
                  fontWeight: 'normal',
                  color: isLightMode ? 'black' : 'white',
                  opacity: 0.65,
                  transition: 'opacity 0.2s',
                }}
              >
                {comboCount > 1
                  ? `we've baked this one ${comboCount} times before${totalBakes !== null ? ` (out of ${totalBakes} total bakes so far)` : ''}`
                  : comboCount === 1
                    ? (totalBakes !== null
                        ? `(first time we've baked this out of ${totalBakes} total bakes so far)`
                        : "(first time we've baked this)")
                    : null}
              </div>
            )}
            <div className="flex gap-4 justify-center mt-2">
              <Button className="bg-primary text-black hover:bg-primary/80" onClick={handleNext}>Bake Another</Button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // Fetch the current user's patron_level from your users table
  useEffect(() => {
    const fetchPatronLevel = async () => {
      const { data: { user: supaUser } } = await supabase.auth.getUser();
      if (supaUser?.id) {
        const { data, error } = await supabase
          .from("users")
          .select("patron_level")
          .eq("id", supaUser.id)
          .single();
        if (!error && data) {
          setPatronLevel(data.patron_level);
        }
      }
    };
    fetchPatronLevel();
  }, []);
  // SSR/hydration-safe: only hide after first client render
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  // Tooltip click handler for non-patrons
  const handleDisabledClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTooltipOpen(true);
  }, []);
  // Close tooltip when clicking anywhere else
  useEffect(() => {
    const handleDocumentClick = () => {
      if (tooltipOpen) setTooltipOpen(false);
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [tooltipOpen]);
  if (!mounted) return null;
  // Patron gating logic - controlled by global feature flag
  const hasAccess = !PATRON_PAYWALL_ENABLED || patronLevel > 0 || user?.isAdmin;
  return (
    <>
      <TooltipProvider delayDuration={0}>
        {hasAccess ? (
          <Dialog
            open={isDialogOpen || showResult}
            onOpenChange={(open) => {
              if (!showResult) {
                setIsDialogOpen(open);
                if (!open) {
                  setSelectedCategory(null);
                  setShowResult(false);
                }
              }
            }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button variant="outline" className="relative h-10 px-3 xs:px-4">
                    <Image 
                      src={resolvedTheme === "light" ? "/hotpocket-lightmode.png" : "/hotpocket.png"}
                      alt="Hot Pocket"
                      width={29}
                      height={29}
                      className="object-contain -my-1"
                    />
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent className="bg-black">
                <span>Hot Pocket Flave-O-Matic<sup>™</sup> v1.1</span>
              </TooltipContent>
            </Tooltip>
            <DialogContent
              className="w-full max-h-[100vh] overflow-y-auto overflow-x-hidden rounded-2xl p-2 xs:p-8 text-center"
              style={isCompact ? { width: '100vw', maxWidth: '100vw', paddingTop: 8, paddingBottom: 8, overflowX: 'hidden' } : { maxWidth: '1200px', overflowX: 'hidden' }}
            >
              <style>{`
                @keyframes pulse-grow {
                  0%, 100% {
                    transform: rotate(30deg) scale(1);
                  }
                  50% {
                    transform: rotate(30deg) scale(1.15);
                  }
                }
              `}</style>
              <DialogTitle className="text-center relative inline-block" style={isCompact ? { fontSize: '1.125rem', lineHeight: '1.25rem', fontWeight: 700, marginTop: 4, marginBottom: 8 } : { fontSize: '2.25rem', lineHeight: '2.5rem', fontWeight: 700 }}>
                Hot Pocket Flave-O-Matic<sup>™</sup> <span style={{ fontSize: '50%', opacity: 0.5, verticalAlign: 'middle' }}>v1.1</span>
              </DialogTitle>
              {!isCompact && (
              <span 
                style={{ 
                  position: 'absolute',
                  left: '50%',
                  top: '17px',
                    marginLeft: '250px',
                  color: '#ebb433',
                  fontSize: '1rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  animation: 'pulse-grow 2s ease-in-out infinite',
                  pointerEvents: 'none',
                  textAlign: 'center',
                  lineHeight: '1.2'
                }}
              >
                now<br />coconut-free!
              </span>
              )}
              {!selectedCategory ? (
                !isMobile ? (
                <div className="flex gap-5 mt-6 justify-center">
                  {categories.map((cat) => (
                    <Button
                      key={cat.key}
                      className={`h-[250px] rounded-xl p-6 flex flex-col items-center justify-center gap-4 transition-all duration-200 ${
                        cat.key === 'breakfast' 
                          ? 'bg-[#d5693f] text-white hover:bg-[#d5693f]/80' 
                          : cat.key === 'dinner'
                          ? 'bg-[#b92638] text-white hover:bg-[#b92638]/80'
                          : 'bg-[#6a3253] text-white hover:bg-[#6a3253]/80'
                      }`}
                      style={{ width: isCompact ? 220 : 250 }}
                      onClick={() => handleCategorySelect(cat.key)}
                    >
                      <div className="w-20 h-20 rounded-lg flex items-center justify-center overflow-hidden">
                        {cat.key === 'breakfast' ? (
                          <Image 
                            src="/breakfast.png" 
                            alt="Breakfast" 
                            width={80} 
                            height={80} 
                            className="object-contain"
                          />
                        ) : cat.key === 'dinner' ? (
                          <Image 
                            src="/dinner.png" 
                            alt="Dinner" 
                            width={80} 
                            height={80} 
                            className="object-contain"
                          />
                        ) : cat.key === 'dessert' ? (
                          <Image 
                            src="/dessert.png" 
                            alt="Dessert" 
                            width={80} 
                            height={80} 
                            className="object-contain"
                          />
                        ) : (
                          <span className="text-2xl">🍽️</span>
                        )}
                      </div>
                      <span className="font-bold text-xl">{cat.label}</span>
                    </Button>
                  ))}
                </div>
              ) : (
                  <div className="flex flex-col gap-3 mt-4">
                    {categories.map((cat) => (
                      <Button
                        key={cat.key}
                        className={`rounded-xl flex flex-col items-center justify-center gap-3 transition-all duration-200 ${
                          cat.key === 'breakfast' 
                            ? 'bg-[#d5693f] text-white hover:bg-[#d5693f]/80' 
                            : cat.key === 'dinner'
                            ? 'bg-[#b92638] text-white hover:bg-[#b92638]/80'
                            : 'bg-[#6a3253] text-white hover:bg-[#6a3253]/80'
                        }`}
                        style={{ width: '100%', paddingTop: 56, paddingBottom: 56, paddingLeft: 16, paddingRight: 16 }}
                        onClick={() => handleCategorySelect(cat.key)}
                      >
                  <div className="rounded-lg flex items-center justify-center" style={{ width: '48px', height: '48px' }}>
                          {cat.key === 'breakfast' ? (
                      <Image src="/breakfast.png" alt="Breakfast" width={48} height={48} className="object-contain !block" />
                          ) : cat.key === 'dinner' ? (
                      <Image src="/dinner.png" alt="Dinner" width={48} height={48} className="object-contain !block" />
                          ) : cat.key === 'dessert' ? (
                      <Image src="/dessert.png" alt="Dessert" width={48} height={48} className="object-contain !block" />
                          ) : (
                            <span className="text-xl">🍽️</span>
                          )}
                        </div>
                        <span className="font-bold text-base">{cat.label}</span>
                      </Button>
                    ))}
                  </div>
                )
              ) : (
                (!isMobile ? (
                <ReelSystem 
                  categoryData={categoryData} 
                  onBakeClick={handleBakeClick}
                  onNext={handleNext}
                  onBakeStart={handleBakeStart}
                  resolvedTheme={resolvedTheme}
                  isCompact={isCompact}
                    isMobile={false}
                  lockTogglesDisabled={lockTogglesDisabled}
                  locked={locked}
                  setLocked={setLocked}
                  categoryColor={getCategoryColor(selectedCategory)}
                />
                ) : (
                  <ReelSystem 
                    categoryData={categoryData} 
                    onBakeClick={handleBakeClick}
                    onNext={handleNext}
                    onBakeStart={handleBakeStart}
                    resolvedTheme={resolvedTheme}
                    isCompact={true}
                    isMobile={true}
                    lockTogglesDisabled={lockTogglesDisabled}
                    locked={locked}
                    setLocked={setLocked}
                    categoryColor={getCategoryColor(selectedCategory)}
                  />
                ))
              )}
            </DialogContent>
          </Dialog>
        ) : (
          <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
            <TooltipTrigger asChild>
              <button
                className="relative h-10 px-3 xs:px-4 rounded-md border border-input bg-background shadow-sm cursor-not-allowed flex items-center justify-center"
                disabled
                style={{ pointerEvents: "auto" }}
                tabIndex={-1}
                onClick={handleDisabledClick}
              >
                <Image
                  src="/hotpocket.png"
                  alt="Hot Pocket"
                  width={29}
                  height={29}
                  className="object-contain -my-1"
                />
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-black text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
              Become a Patreon patron to play with our famous Hot Pocket Flave-O-Matic<sup>™</sup>.
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
      <ResultsModal />
    </>
  );
};

export default HotPocketGenerator; 