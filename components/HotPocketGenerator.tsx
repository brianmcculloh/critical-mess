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

const categories = [
  { key: "breakfast", label: "Breakfast" },
  { key: "dinner", label: "Dinner" },
  { key: "dessert", label: "Dessert" },
];

const bandNames = ["Base", "Modifier", "Crust", "Seasoning"];
const bandLabels: Record<string, string> = {
  Base: "The Pocket",
  Modifier: "The Special Ingredient",
  Crust: "The Crust",
  Seasoning: "The Seasoning"
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
  { label: "blasted", weight: 20 },
];

// Extend Ingredient type for hit marking
// @ts-ignore
interface HitIngredient extends Ingredient { isHit?: boolean; }

// Standalone Reel System Component - Completely isolated
const ReelSystem = memo(function ReelSystem({ 
  categoryData, 
  onBakeClick,
  onNext,
  resolvedTheme,
  isCompact
}: { 
  categoryData: any;
  onBakeClick: (hitItems: HitIngredient[], seasoningStyle: string) => void;
  onNext: () => void;
  resolvedTheme: string | undefined;
  isCompact: boolean;
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

  // Add state for lock toggles (Modifier, Crust, Seasoning)
  // [Base, Modifier, Crust, Seasoning] - only Modifier (1), Crust (2), Seasoning (3) are lockable
  const [locked, setLocked] = useState([false, false, false, false]);

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
  const Reel = memo(function Reel({ items, selectedIdx, greyed, bandName, reelIndex, resolvedTheme, isCompact, locked }: { 
    items: HitIngredient[];
    selectedIdx: number; 
    greyed: boolean; 
    bandName: string; 
    reelIndex: number;
    resolvedTheme: string | undefined;
    isCompact: boolean;
    locked: boolean;
  }) {
    const borderColor = locked ? '#fbbf24' : 'hsl(var(--border))';
    const isLightMode = resolvedTheme === "light";
    const outerBorderWidthLocal = isCompact ? 2 : 4;
    const itemWidth = isCompact ? 140 : 200;
    const itemHeight = isCompact ? 140 : 200;
    const outerReelHeight = isCompact ? 420 : 535;
    const itemFont = isCompact ? { fontSize: '.8rem', lineHeight: '1.2rem' } : {};
    return (
      <div
        className={`relative flex items-center justify-center rounded-xl ${isLightMode ? 'bg-white' : 'bg-black'} w-56 min-w-56 max-w-56`}
        style={{
          height: outerReelHeight,
          border: `${outerBorderWidthLocal}px solid ${borderColor}`,
          ...(isCompact ? { width: 172, minWidth: 172, maxWidth: 172 } : {}),
        }}
      >
        <div className="pointer-events-none absolute top-0 left-0 w-full z-20 rounded-t-[10px]" style={{height: '75px', background: isLightMode ? 'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)' : 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)'}} />
        <div className="pointer-events-none absolute bottom-0 left-0 w-full z-20 rounded-b-[10px]" style={{height: '75px', background: isLightMode ? 'linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)' : 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)'}} />
        <div 
          ref={(el) => { 
            reelRefs.current[reelIndex] = el; 

          }}
          className="relative z-10 w-full h-full overflow-hidden rounded-[10px]"
        >
          <div className="w-full">
            {items.map((item, idx) => {
              const backgroundColor = isLightMode ? 'white' : 'black';
              return (
                <div
                  key={`${item.name}-${idx}`}
                  className={`flex flex-col items-center justify-center w-full border-b-[3px] border-dashed px-5 text-center p-[15px]`}
                  style={{
                    minHeight: itemHeight,
                    maxHeight: itemHeight,
                    height: itemHeight,
                    backgroundColor,
                    borderColor: 'hsl(var(--border)/0.5)',
                    borderStyle: 'dashed',
                    borderWidth: '0 0 3px 0',
                  }}
                >
                  <div className="w-16 h-16 rounded mb-2 flex items-center justify-center mx-auto">
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
                            width={64} 
                            height={64} 
                            className={`object-contain ${opacityClass}`}
                          />
                        );
                      } else if (bandName === 'Modifier') {
                        return (
                          <Image 
                            src={isLightMode ? "/modifier-lightmode.png" : "/modifier.png"}
                            alt="Modifier" 
                            width={64} 
                            height={64} 
                            className={`object-contain ${opacityClass}`}
                          />
                        );
                      } else if (bandName === 'Crust') {
                        return (
                          <Image 
                            src={isLightMode ? "/crust-lightmode.png" : "/crust.png"}
                            alt="Crust" 
                            width={64} 
                            height={64} 
                            className={`object-contain ${opacityClass}`}
                          />
                        );
                      } else if (bandName === 'Seasoning') {
                        return (
                          <Image 
                            src={isLightMode ? "/seasoning-lightmode.png" : "/seasoning.png"}
                            alt="Seasoning" 
                            width={64} 
                            height={64} 
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
          const maxScroll = reelRef.scrollHeight - reelRef.clientHeight;
          // Offset by 40px for normal, 5px for compact (fine-tuned for center alignment)
          const offset = isCompactArg ? 5 : 40;
          const targetScroll = maxScroll - offset;
          const currentScroll = targetScroll * easeOutCubic;
          reelRef.scrollTop = currentScroll;
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
    <div className="flex flex-col gap-6 mt-6">
      <div className="relative grid grid-cols-4 gap-5 justify-center place-items-center mx-auto">
        {/* Center line indicator - spans across entire panel behind reels */}
        <div className="pointer-events-none absolute z-0 h-0.5 bg-muted-foreground/60" style={{
          left: '-100px',
          right: '-100px',
          top: 'calc(50% + 3px)',
          transform: 'translateY(-50%)'
        }} />
        {bandNames.map((band, i) => {
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
                items={reelItemsList[i] as HitIngredient[]} // Cast to HitIngredient[]
                selectedIdx={selectedIndices[i]}
                greyed={isNone}
                bandName={band}
                reelIndex={i}
                resolvedTheme={resolvedTheme}
                isCompact={isCompact}
                locked={locked[i]}
              />
              {/* Add lock toggle for Modifier, Crust, Seasoning; add spacer for Base */}
              {i === 0 ? (
                <div className="flex flex-col items-center mt-2" style={{ height: isCompact ? 19 : 23 }} />
              ) : (
                <div className="flex flex-col items-center mt-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`lock-toggle-${i}`}
                      checked={locked[i]}
                      onCheckedChange={checked => setLocked(l => l.map((v, idx) => idx === i ? checked : v))}
                      className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input border border-gray-300 dark:border-accent"
                    />
                    <Label htmlFor={`lock-toggle-${i}`} className="text-xs font-medium select-none text-muted-foreground dark:text-gray-300">
                      locked on
                    </Label>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="flex gap-4 mt-4 justify-center">
        <Button
          className="bg-primary text-black hover:bg-primary/80"
          onClick={handleBake}
          disabled={isBaking}
        >
          {isBaking ? "Baking..." : "Bake @350°"}
        </Button>
        <Button
          className="transition-colors bg-secondary hover:bg-secondary/70 text-black dark:text-white"
          onClick={handleStartOver}
        >
          Start Over
        </Button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if categoryData changes
  // Ignore onBakeClick changes to prevent re-renders when modal state changes
  return prevProps.categoryData === nextProps.categoryData;
});

const HotPocketGenerator: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  // Responsive: 991px and below
  const [isCompact, setIsCompact] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const check = () => {
      setIsCompact(window.innerWidth <= 991);
      setIsNarrow(window.innerWidth < 1180);
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
  };

  const handleNext = () => {
    setSelectedCategory(null);
    setShowResult(false);
  };

  const handleCloseResult = () => {
    setShowResult(false);
  };

  const handleBakeClick = (hitItems: HitIngredient[], seasoningStyle: string) => {
    hitItemsRef.current = hitItems;
    seasoningStyleRef.current = seasoningStyle;
    setShowResult(true);
  };

  const categoryData = selectedCategory ? hotPocketData[selectedCategory] : null;

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
        className="fixed top-0 left-0 right-0 bottom-0 z-[9999] bg-black/50 pointer-events-auto"
        onClick={() => setShowResult(false)}
      >
        <div
          className="fixed left-1/2 z-[10000] bg-background border rounded-2xl p-8 text-center w-[750px] max-w-[750px] pointer-events-auto"
          style={{
            top: '25px',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translate(-50%, 0)' : 'translate(-50%, 80px)',
            transition: 'opacity 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)',
          }}
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
          <h2 className="text-[29px] font-bold mb-4">Your Hot Pocket is ready!</h2>
          <div className="flex flex-col gap-6">
            <div className="text-3xl font-bold mb-2">
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
            <div className={isLightMode ? "text-base text-black" : "text-base text-white"}>
              *{hitItemsRef.current[0]?.ingredientList?.map(ingredient => ingredient.toLowerCase()).join(", ")}
            </div>
            <div className="flex gap-4 justify-center mt-6">
              <Button className="bg-primary text-black hover:bg-primary/80" onClick={handleNext}>Bake Another</Button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // SSR/hydration-safe: only hide after first client render
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Hide completely on 767px and below
  const [isHidden, setIsHidden] = useState(false);
  useEffect(() => {
    const checkHidden = () => setIsHidden(window.innerWidth <= 767);
    checkHidden();
    window.addEventListener('resize', checkHidden);
    return () => window.removeEventListener('resize', checkHidden);
  }, []);

  if (!mounted || isHidden) return null;
  return (
    <>
      <Dialog
        open={isDialogOpen || showResult}
        onOpenChange={(open) => {
          // Only allow closing if results modal is not open
          if (!showResult) {
            setIsDialogOpen(open);
            // Reset to category view when dialog is closed
            if (!open) {
              setSelectedCategory(null);
              setShowResult(false);
            }
          }
        }}
      >
        <TooltipProvider delayDuration={0}>
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
              <span>Hot Pocket Generator</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DialogContent
          className={
            isNarrow
              ? "mt-5 max-h-[calc(100vh-40px)] rounded-2xl p-2 xs:p-8 py-8 xs:py-16 text-center"
              : "w-[calc(100vw-200px)] max-w-[calc(100vw-200px)] mt-5 max-h-[calc(100vh-40px)] rounded-2xl p-8 py-16 text-center"
          }
          style={
            isNarrow
              ? { width: '100vw', maxWidth: '100vw', margin: '0 auto' }
              : undefined
          }
        >
          <DialogTitle className="text-center" style={{ fontSize: '2.25rem', lineHeight: '2.5rem', fontWeight: 700 }}>
            Hot Pocket Generator
          </DialogTitle>
          <DialogDescription className="text-center">
            192,000 possible flavor combinations! Most of them make sense.
          </DialogDescription>
          {!selectedCategory ? (
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
                        className="object-cover"
                      />
                    ) : cat.key === 'dinner' ? (
                      <Image 
                        src="/dinner.png" 
                        alt="Dinner" 
                        width={80} 
                        height={80} 
                        className="object-cover"
                      />
                    ) : cat.key === 'dessert' ? (
                      <Image 
                        src="/dessert.png" 
                        alt="Dessert" 
                        width={80} 
                        height={80} 
                        className="object-cover"
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
            <ReelSystem 
              categoryData={categoryData} 
              onBakeClick={handleBakeClick}
              onNext={handleNext}
              resolvedTheme={resolvedTheme}
              isCompact={isCompact}
            />
          )}
        </DialogContent>
      </Dialog>
      <ResultsModal />
    </>
  );
};

export default HotPocketGenerator; 