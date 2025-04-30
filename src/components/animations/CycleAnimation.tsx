import { useState, useEffect } from "react";
import { CycleType, CycleParams } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Play, Pause, RefreshCw } from "lucide-react";
import OttoAnimation from "./cycle-components/OttoAnimation";
import DieselAnimation from "./cycle-components/DieselAnimation";
import BraytonAnimation from "./cycle-components/BraytonAnimation";
import RankineAnimation from "./cycle-components/RankineAnimation";

interface CycleAnimationProps {
  cycleType: CycleType;
  cycleParams: CycleParams;
}

const CycleAnimation = ({ cycleType, cycleParams }: CycleAnimationProps) => {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Reset animation when cycle type changes
    setIsAnimating(true);
  }, [cycleType]);

  return (
    <div className="w-full h-full relative">
      {cycleType === "Otto" && (
        <OttoAnimation params={cycleParams} isAnimating={isAnimating} />
      )}
      {cycleType === "Diesel" && (
        <DieselAnimation params={cycleParams} isAnimating={isAnimating} />
      )}
      {cycleType === "Brayton" && (
        <BraytonAnimation params={cycleParams} isAnimating={isAnimating} />
      )}
      {cycleType === "Rankine" && (
        <RankineAnimation params={cycleParams} isAnimating={isAnimating} />
      )}

      <div className="absolute bottom-2 right-2 flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 rounded-full"
          onClick={() => setIsAnimating(!isAnimating)}
        >
          {isAnimating ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 rounded-full"
          onClick={() => {
            setIsAnimating(false);
            setTimeout(() => setIsAnimating(true), 100);
          }}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CycleAnimation;
