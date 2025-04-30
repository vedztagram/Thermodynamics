import { Card, CardContent } from "@/components/ui/card";
import { CycleType, CycleParams } from "@/lib/types";
import CycleAnimation from "./CycleAnimation";

interface ComponentAnimationProps {
  cycleType: CycleType;
  cycleParams: CycleParams;
}

const ComponentAnimation = ({
  cycleType,
  cycleParams,
}: ComponentAnimationProps) => {
  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="w-full h-[250px] flex items-center justify-center">
          <CycleAnimation cycleType={cycleType} cycleParams={cycleParams} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ComponentAnimation;
