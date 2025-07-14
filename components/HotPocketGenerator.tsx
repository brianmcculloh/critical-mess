import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import hotPocketData, { HotPocketData, Ingredient } from "./hotPocketData";
import { Utensils } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const categories = [
  { key: "breakfast", label: "Breakfast" },
  { key: "dinner", label: "Dinner" },
  { key: "dessert", label: "Dessert" },
];

const bandNames = ["Base", "Modifier", "Crust", "Seasoning"];

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
  onNext
}: { 
  categoryData: any;
  onBakeClick: (hitItems: HitIngredient[], seasoningStyle: string) => void;
  onNext: () => void;
}) {
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
  const Reel = memo(function Reel({ items, selectedIdx, greyed, bandName, reelIndex }: { 
    items: HitIngredient[];
    selectedIdx: number; 
    greyed: boolean; 
    bandName: string; 
    reelIndex: number;
  }) {

    
    const borderColor = 'hsl(var(--border))';
    return (
      <div
        className={`relative h-[535px] w-56 flex items-center justify-center rounded-xl bg-black`}
        style={{
          border: `4px solid ${borderColor}`,
        }}
      >
        <div className="pointer-events-none absolute top-0 left-0 w-full z-20 rounded-t-[10px]" style={{height: '75px', background: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)'}} />
        <div className="pointer-events-none absolute bottom-0 left-0 w-full z-20 rounded-b-[10px]" style={{height: '75px', background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)'}} />
        <div 
          ref={(el) => { 
            reelRefs.current[reelIndex] = el; 

          }}
          className="relative z-10 w-full h-full overflow-hidden rounded-[10px]"
        >
          <div className="w-full">
            {items.map((item, idx) => {
              const backgroundColor = 'black';
              return (
                <div
                  key={`${item.name}-${idx}`}
                  className={`min-h-[200px] max-h-[200px] h-[200px] flex flex-col items-center justify-center w-full border-b-[3px] border-dashed px-5 text-center p-[15px]`}
                  style={{
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
                            src="/hotpocket.png" 
                            alt="Base" 
                            width={64} 
                            height={64} 
                            className={`object-contain ${opacityClass}`}
                          />
                        );
                      } else if (bandName === 'Modifier') {
                        return (
                          <Image 
                            src="/modifier.png" 
                            alt="Modifier" 
                            width={64} 
                            height={64} 
                            className={`object-contain ${opacityClass}`}
                          />
                        );
                      } else if (bandName === 'Crust') {
                        return (
                          <Image 
                            src="/crust.png" 
                            alt="Crust" 
                            width={64} 
                            height={64} 
                            className={`object-contain ${opacityClass}`}
                          />
                        );
                      } else if (bandName === 'Seasoning') {
                        return (
                          <Image 
                            src="/seasoning.png" 
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
                  <span className={`text-base ${item.isHit && item.name !== 'None' && !(reelIndex === 2 && item.name === 'Original') ? 'text-white font-bold' : 'text-card-foreground opacity-50'}`}>{item?.name || ""}</span>
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
      const hitIdx = weightedRandom(allItems);
      const hitItem = allItems[hitIdx];
      newHitItems[i] = { ...hitItem, isHit: true };
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
    const animateScroll = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      reelRefs.current.forEach((reelRef, index) => {
        if (reelRef) {
          const maxScroll = reelRef.scrollHeight - reelRef.clientHeight;
          const targetScroll = maxScroll - 40; // Offset by 40px
          const currentScroll = targetScroll * easeOutCubic;
          reelRef.scrollTop = currentScroll;
        }
      });
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
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
                reelContainer.style.border = '4px solid #fbbf24';
                reelContainer.style.boxShadow = '0 0 10px rgba(251, 191, 36, 0.5)';
              } else {
                // Keep default border for "None" selections
                reelContainer.style.border = '4px solid hsl(var(--border))';
                reelContainer.style.boxShadow = 'none';
              }
            }
          }
        });
      }
    };
    requestAnimationFrame(animateScroll);

    // 6) Exactly 4 seconds after the user clicks bake, the results modal should become visible
    modalTimerRef.current = setTimeout(() => {

      onBakeClick(newHitItems, seasoningStyle);
    }, 4000);
  };

  return (
    <div className="flex flex-col gap-6 mt-6">
      <div className="relative grid grid-cols-4 gap-5 justify-center place-items-center mx-auto">
        {/* Center line indicator - spans across entire panel behind reels */}
        <div className="pointer-events-none absolute z-0 h-0.5 bg-muted-foreground/60" style={{
          left: '-100px',
          right: '-100px',
          top: 'calc(50% + 18px)',
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
              <div className="font-bold text-md mb-2 text-center">{band}</div>
              <Reel
                items={reelItemsList[i] as HitIngredient[]} // Cast to HitIngredient[]
                selectedIdx={selectedIndices[i]}
                greyed={isNone}
                bandName={band}
                reelIndex={i}
              />
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
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  
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
    if (!categoryData || hitItems.length === 0) return { parts: [] };
    const [base, modifier, crust, seasoning] = hitItems;
    
    // Helper function to check if a word starts with a vowel
    const startsWithVowel = (word: string) => {
      const vowels = ['a', 'e', 'i', 'o', 'u'];
      return vowels.includes(word.toLowerCase().charAt(0));
    };
    
    const parts: { text: string; type: 'white' | 'primary' | 'seasoning' }[] = [];
    
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
    }
    
    return { parts };
  }

  // Portal-based Results Modal
  const ResultsModal = () => {
    
    if (!showResult || !categoryData) return null;

    return createPortal(
      <div
        className="fixed top-0 left-0 right-0 bottom-0 z-[9999] bg-black/50 pointer-events-auto"
        onClick={() => setShowResult(false)}
      >
        <div
          className="fixed top-[25px] left-1/2 transform -translate-x-1/2 z-[10000] bg-background border rounded-2xl p-8 text-center w-[750px] max-w-[750px] pointer-events-auto"
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
              src="/hotpocket.png" 
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
                <span className="text-white">It's {getResultText(hitItemsRef.current, seasoningStyleRef.current).parts.length > 0 && getResultText(hitItemsRef.current, seasoningStyleRef.current).parts[0].text.toLowerCase().match(/^[aeiou]/) ? 'an ' : 'a '}</span>
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
                      <span key={index} className="text-white">
                        {part.text}
                      </span>
                    );
                  }
                })}
              </div>
            </div>
            <div className="text-base text-white">
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
        <DialogTrigger asChild>
          <Button className="transition-colors bg-secondary hover:bg-secondary/70 text-black dark:text-white">
            Hot Pocket Generator
            <Utensils className="transform w-5 h-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[calc(100vw-200px)] max-w-[calc(100vw-200px)] mt-5 max-h-[calc(100vh-40px)] overflow-y-auto rounded-2xl p-8 py-16 text-center">
          <DialogTitle className="text-center">Hot Pocket Generator</DialogTitle>
          <DialogDescription className="text-center">
            192,000 possible flavor combinations! Most of them make sense.
          </DialogDescription>
          {!selectedCategory ? (
            <div className="flex gap-5 mt-6 justify-center">
              {categories.map((cat) => (
                <Button
                  key={cat.key}
                  className={`w-[250px] h-[250px] rounded-xl p-6 flex flex-col items-center justify-center gap-4 transition-all duration-200 ${
                    cat.key === 'breakfast' 
                      ? 'bg-[#d5693f] text-white hover:bg-[#d5693f]/80' 
                      : cat.key === 'dinner'
                      ? 'bg-[#b92638] text-white hover:bg-[#b92638]/80'
                      : 'bg-[#6a3253] text-white hover:bg-[#6a3253]/80'
                  }`}
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
            />
          )}
        </DialogContent>
      </Dialog>
      <ResultsModal />
    </>
  );
};

export default HotPocketGenerator; 