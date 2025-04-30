import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CycleSelector from "@/components/controls/CycleSelector";
import ParameterControls from "@/components/controls/ParameterControls";
import DiagramTabs from "@/components/diagrams/DiagramTabs";
import PerformanceMetrics from "@/components/metrics/PerformanceMetrics";
import ComponentAnimation from "@/components/animations/ComponentAnimation";
import { CycleType, CycleParams, defaultCycleParams } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "react-router-dom";

const Index = () => {
  const [selectedCycle, setSelectedCycle] = useState<CycleType>("Otto");
  const [cycleParams, setCycleParams] = useState<CycleParams>(
    defaultCycleParams.Otto,
  );

  const handleCycleChange = (cycle: CycleType) => {
    setSelectedCycle(cycle);
    setCycleParams(defaultCycleParams[cycle]);
  };

  const handleParamChange = (newParams: Partial<CycleParams>) => {
    setCycleParams((prev) => ({ ...prev, ...newParams }));
  };

  const getCycleDescription = (cycleType: CycleType) => {
    const descriptions = {
      Otto: "The Otto cycle is the ideal thermodynamic cycle for spark-ignition internal combustion engines. It consists of isentropic compression, constant-volume heat addition, isentropic expansion, and constant-volume heat rejection.",
      Diesel:
        "The Diesel cycle is the ideal thermodynamic cycle for compression-ignition engines. It features isentropic compression, constant-pressure heat addition, isentropic expansion, and constant-volume heat rejection.",
      Brayton:
        "The Brayton cycle is the ideal thermodynamic cycle for gas turbine engines. It consists of isentropic compression, constant-pressure heat addition, isentropic expansion, and constant-pressure heat rejection.",
    };

    return descriptions[cycleType] || "";
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <Card className="border-t-4 border-t-primary">
          <CardContent className="pt-6 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">
                  Thermodynamic Cycle Simulator
                </h1>
                <p className="text-muted-foreground">
                  {getCycleDescription(selectedCycle)}
                </p>
                <Link to="/cycles/Otto">
                  <Button variant="outline" className="mt-2">
                    Go to Otto Cycle Simulator
                  </Button>
                </Link>
                <Link to="/cycles/Diesel">
                  <Button variant="outline" className="mt-2">
                    Go to Diesel Cycle Simulator
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Info className="h-4 w-4" />
                        Help
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md">
                      <p>
                        This simulator helps you analyze thermodynamic cycles by
                        adjusting parameters and visualizing the results. Select
                        a cycle type, modify the parameters, and observe how
                        changes affect performance metrics and diagrams.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col lg:flex-row gap-6 w-full">
          <div className="w-full lg:w-1/4">
            <CycleSelector
              selectedCycle={selectedCycle}
              onCycleChange={handleCycleChange}
            />
          </div>
          <div className="w-full lg:w-2/4">
            <ComponentAnimation
              cycleType={selectedCycle}
              cycleParams={cycleParams}
            />
          </div>
          <div className="w-full lg:w-1/4">
            <PerformanceMetrics
              cycleType={selectedCycle}
              cycleParams={cycleParams}
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 w-full">
          <div className="w-full lg:w-1/4">
            <ParameterControls
              cycleType={selectedCycle}
              cycleParams={cycleParams}
              onParamChange={handleParamChange}
            />
          </div>
          <div className="w-full lg:w-3/4">
            <DiagramTabs
              cycleType={selectedCycle}
              cycleParams={cycleParams}
              onParamChange={handleParamChange}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
