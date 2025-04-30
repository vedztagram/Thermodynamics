import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Download,
  Table,
  Play,
  Pause,
  Settings2,
  FileSpreadsheet,
} from "lucide-react";
import PVDiagram from "./PVDiagram";
import TSDiagram from "./TSDiagram";
import StateTable from "./StateTable";
import ComponentParameters from "./ComponentParameters";
import { CycleType, CycleParams } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface DiagramTabsProps {
  cycleType: CycleType;
  cycleParams: CycleParams;
  onParamChange?: (params: Partial<CycleParams>) => void;
}

const DiagramTabs = ({
  cycleType,
  cycleParams,
  onParamChange,
}: DiagramTabsProps) => {
  const [activeTab, setActiveTab] = useState("pv");
  const [isAnimating, setIsAnimating] = useState(true);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const handleExportCSV = () => {
    toast.success("Exporting data as CSV");
    // The actual CSV export is handled in the StateTable component
  };

  const handleSaveDiagram = () => {
    toast.success("Saving diagram as PNG");

    // In a real implementation, this would save the current diagram as an image
    // using html2canvas or similar library
    setTimeout(() => {
      const link = document.createElement("a");
      link.setAttribute("href", "#");
      link.setAttribute("download", `${cycleType}_${activeTab}_diagram.png`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 500);
  };

  const handleExportExcel = () => {
    toast.success("Exporting data as Excel file");

    // In a real implementation, this would generate and download an Excel file
    setTimeout(() => {
      const link = document.createElement("a");
      link.setAttribute("href", "#");
      link.setAttribute("download", `${cycleType}_cycle_data.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 500);
  };

  const getDiagramTitle = () => {
    switch (activeTab) {
      case "pv":
        return "Pressure-Volume (P-V) Diagram";
      case "ts":
        return "Temperature-Entropy (T-S) Diagram";
      case "state":
        return "State Table & Entropy Analysis";
      case "components":
        return "Component Parameters";
      default:
        return "Cycle Diagrams";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          {getDiagramTitle()}
        </CardTitle>
        <div className="flex space-x-2">
          <Button
            variant={isAnimating ? "default" : "outline"}
            size="sm"
            onClick={() => setIsAnimating(!isAnimating)}
            className="text-xs flex items-center gap-1"
          >
            {isAnimating ? (
              <>
                <Pause className="h-3.5 w-3.5" /> Pause Animation
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> Start Animation
              </>
            )}
          </Button>

          <Dialog open={showExportOptions} onOpenChange={setShowExportOptions}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-xs flex items-center gap-1"
              >
                <Download className="h-3.5 w-3.5" />
                Export Data
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Export Options</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  className="flex items-center justify-start gap-2"
                >
                  <Table className="h-4 w-4" />
                  Export as CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportExcel}
                  className="flex items-center justify-start gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Export as Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSaveDiagram}
                  className="flex items-center justify-start gap-2"
                >
                  <Download className="h-4 w-4" />
                  Save Diagram as PNG
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDiagram}
            className="text-xs flex items-center gap-1"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Settings
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pv">P-V Diagram</TabsTrigger>
            <TabsTrigger value="ts">T-S Diagram</TabsTrigger>
            <TabsTrigger value="state">State Table</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
          </TabsList>
          <div className="pt-4 h-[500px]">
            <TabsContent value="pv" className="h-full">
              <PVDiagram
                cycleType={cycleType}
                cycleParams={cycleParams}
                onParamChange={onParamChange}
              />
            </TabsContent>
            <TabsContent value="ts" className="h-full">
              <TSDiagram
                cycleType={cycleType}
                cycleParams={cycleParams}
                onParamChange={onParamChange}
              />
            </TabsContent>
            <TabsContent value="state" className="h-full overflow-auto">
              <StateTable cycleType={cycleType} cycleParams={cycleParams} />
            </TabsContent>
            <TabsContent value="components" className="h-full overflow-auto">
              <ComponentParameters
                cycleType={cycleType}
                cycleParams={cycleParams}
                onParamChange={onParamChange}
                isAnimating={isAnimating}
              />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DiagramTabs;
