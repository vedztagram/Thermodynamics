import React from "react";
import { CycleType } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface CycleSelectorProps {
  selectedCycle: CycleType;
  onCycleChange: (cycle: CycleType) => void;
}

const cycleLabels: Record<CycleType, string> = {
  Brayton: "Brayton Cycle",
  Otto: "Otto Cycle",
  Diesel: "Diesel Cycle",
};

const CycleSelector = ({
  selectedCycle,
  onCycleChange,
}: CycleSelectorProps) => {
  return (
    <div>
      {Object.keys(cycleLabels).map((cycleType) => (
        <Button
          key={cycleType}
          variant={selectedCycle === cycleType ? "default" : "outline"}
          className="w-full mb-2"
          onClick={() => onCycleChange(cycleType as CycleType)}
        >
          {cycleLabels[cycleType as CycleType]}
        </Button>
      ))}
    </div>
  );
};

export default CycleSelector;
