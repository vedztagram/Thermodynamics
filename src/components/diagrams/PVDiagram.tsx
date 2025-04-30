import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { calculateCycleStatePoints } from "@/lib/thermodynamics";
import { CycleType, CycleParams } from "@/lib/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings2 } from "lucide-react";

interface PVDiagramProps {
  cycleType: CycleType;
  cycleParams: CycleParams;
  onParamChange?: (params: Partial<CycleParams>) => void;
}

const PVDiagram = ({
  cycleType,
  cycleParams,
  onParamChange,
}: PVDiagramProps) => {
  const previousDataRef = useRef<any>(null);
  const [editingPoint, setEditingPoint] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ v?: number; p?: number }>({});
  const [showSettings, setShowSettings] = useState(false);
  const [showStateLabels, setShowStateLabels] = useState(true);
  const [visibleStatePoints, setVisibleStatePoints] = useState<
    Record<string, boolean>
  >({
    "1": true,
    "2": true,
    "2a": true,
    "3": true,
    "3a": true,
    "4": true,
    "5": true,
    "6": true,
  });

  // Generate P-V data based on cycle type and parameters
  const generatePVData = () => {
    try {
      const cycleData = calculateCycleStatePoints(cycleType, cycleParams);
      const points = Object.entries(cycleData.points).map(([key, point]) => ({
        name: key,
        v: point.v,
        p: point.p,
        T: point.T,
        h: point.h,
        s: point.s,
        x: point.x,
      }));

      // Sort points according to the cycle sequence
      const sortOrder: Record<string, number> = {
        "1": 0,
        "2": 1,
        "2a": 2,
        "3": 3,
        "3a": 4,
        "4": 5,
        "5": 6,
        "6": 7,
      };

      const sortedPoints = [...points].sort((a, b) => {
        return (sortOrder[a.name] || 0) - (sortOrder[b.name] || 0);
      });

      // Create a single cycle line by adding the first point at the end
      if (sortedPoints.length > 0) {
        const firstMainPoint =
          sortedPoints.find((p) => !p.name.includes("s")) || sortedPoints[0];
        sortedPoints.push({ ...firstMainPoint, name: "end" });
      }

      previousDataRef.current = sortedPoints;
      return sortedPoints;
    } catch (error) {
      console.error("Error generating PV data:", error);
      return previousDataRef.current || [];
    }
  };

  const data = generatePVData();

  // Find min and max values for axes with some padding
  const minV = Math.min(...data.map((point) => point.v || 0.001)) * 0.8;
  const maxV = Math.max(...data.map((point) => point.v || 0.1)) * 1.2;
  const minP = Math.min(...data.map((point) => point.p || 10)) * 0.8;
  const maxP = Math.max(...data.map((point) => point.p || 100)) * 1.2;

  // Handle parameter changes
  const handlePointEdit = (
    pointName: string,
    newValues: { v?: number; p?: number },
  ) => {
    if (!onParamChange) return;

    // Map state point changes to cycle parameters
    const paramUpdates: Partial<CycleParams> = {};

    // Based on which point is edited, update the appropriate parameters
    switch (pointName) {
      case "1":
        if (newValues.p) paramUpdates.p_low = newValues.p;
        break;
      case "3":
      case "3a":
        if (newValues.p) paramUpdates.p_high = newValues.p;
        break;
      // Add compression ratio calculation for Otto/Diesel cycles
      case "2":
        if (newValues.v && data.find((p) => p.name === "1")?.v) {
          const v1 = data.find((p) => p.name === "1")?.v || 1;
          const v2 = newValues.v;
          const compressionRatio = v1 / v2;
          if (cycleType === "Otto" || cycleType === "Diesel") {
            paramUpdates.compression_ratio = compressionRatio;
          }
        }
        break;
    }

    if (Object.keys(paramUpdates).length > 0) {
      onParamChange(paramUpdates);
    }

    setEditingPoint(null);
    setEditValues({});
  };

  // Toggle visibility of a specific state point
  const toggleStatePoint = (name: string) => {
    setVisibleStatePoints((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  // Toggle all state point labels on/off
  const toggleAllStatePoints = (value: boolean) => {
    const allPoints: Record<string, boolean> = {};
    Object.keys(visibleStatePoints).forEach((key) => {
      allPoints[key] = value;
    });
    setVisibleStatePoints(allPoints);
  };

  // Custom tooltip to show all properties
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length && payload[0]?.payload) {
      const pointData = payload[0].payload;

      return (
        <Card className="p-2 text-xs bg-white border shadow">
          <p className="font-bold">{`State Point ${pointData.name || ""}`}</p>
          <p>{`Pressure: ${pointData.p?.toFixed(2) || "N/A"} kPa`}</p>
          <p>{`Volume: ${pointData.v?.toFixed(6) || "N/A"} m³/kg`}</p>
          <p>{`Temperature: ${pointData.T?.toFixed(2) || "N/A"} K`}</p>
          {pointData.h !== undefined && (
            <p>{`Enthalpy: ${pointData.h.toFixed(2)} kJ/kg`}</p>
          )}
          {pointData.s !== undefined && (
            <p>{`Entropy: ${pointData.s.toFixed(4)} kJ/kg·K`}</p>
          )}
          {pointData.x !== undefined && (
            <p>{`Quality: ${(pointData.x * 100).toFixed(1)}%`}</p>
          )}
        </Card>
      );
    }
    return null;
  };

  // Create isothermal reference curves
  const generateIsothermalCurves = () => {
    // Get a few representative temperatures from the cycle
    const temps = [
      Math.min(...data.map((p) => p.T || 0)),
      (Math.min(...data.map((p) => p.T || 0)) +
        Math.max(...data.map((p) => p.T || 0))) /
        2,
      Math.max(...data.map((p) => p.T || 0)),
    ];

    return temps.map((temp, idx) => {
      // For each temperature, create a PV curve (p = nRT/V)
      const curvePoints = [];
      for (let i = 0; i < 20; i++) {
        const v = minV * Math.pow(maxV / minV, i / 19);
        const p = (100 * temp) / v; // Simplified ideal gas law curve
        curvePoints.push({ v, p });
      }

      return (
        <Line
          key={`isothermal-${idx}`}
          data={curvePoints}
          type="monotone"
          dataKey="p"
          stroke="#999"
          strokeWidth={0.5}
          strokeDasharray="2 2"
          dot={false}
          isAnimationActive={false}
        />
      );
    });
  };

  // Function to check if a state point should be rendered
  const shouldRenderStatePoint = (pointName: string) => {
    // Only render if it's visible in settings and not the closing point
    return (visibleStatePoints[pointName] || false) && pointName !== "end";
  };

  // Fixed formatter function with type checking
  const formatAxisTick = (value: any) => {
    if (typeof value === "number") {
      return value.toExponential(1);
    }
    // Return a fallback string for non-numeric values
    return String(value || "");
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Pressure-Volume (P-V) Diagram</h3>
        <Popover open={showSettings} onOpenChange={setShowSettings}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <Settings2 className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <h4 className="font-medium mb-2">Diagram Settings</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-labels"
                  checked={showStateLabels}
                  onCheckedChange={(checked) => setShowStateLabels(!!checked)}
                />
                <Label htmlFor="show-labels">Show State Point Labels</Label>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">
                    Visible State Points
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAllStatePoints(true)}
                    >
                      All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAllStatePoints(false)}
                    >
                      None
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(visibleStatePoints)
                    .filter((key) => data.some((point) => point.name === key))
                    .sort((a, b) =>
                      a.localeCompare(b, undefined, { numeric: true }),
                    )
                    .map((key) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`state-${key}`}
                          checked={visibleStatePoints[key]}
                          onCheckedChange={() => toggleStatePoint(key)}
                        />
                        <Label htmlFor={`state-${key}`}>State {key}</Label>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex-grow bg-white rounded-md border p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <defs>
              <linearGradient id="colorP" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1A5F7A" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#1A5F7A" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="v"
              type="number"
              domain={[minV, maxV]}
              label={{
                value: "Specific Volume (m³/kg)",
                position: "insideBottom",
                offset: -5,
              }}
              scale="log"
              tickFormatter={formatAxisTick}
            />
            <YAxis
              dataKey="p"
              type="number"
              domain={[minP, maxP]}
              label={{
                value: "Pressure (kPa)",
                angle: -90,
                position: "insideLeft",
              }}
              scale="log"
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Engineering reference curves */}
            {generateIsothermalCurves()}

            {/* The main cycle line - one continuous line */}
            <Line
              data={data}
              type="linear"
              dataKey="p"
              stroke="#1A5F7A"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={true}
              fill="url(#colorP)"
            />

            {/* Add reference dots for state points */}
            {data
              .filter((point) => shouldRenderStatePoint(point.name))
              .map((point, index) => (
                <Popover
                  key={index}
                  open={editingPoint === point.name}
                  onOpenChange={(open) =>
                    open ? setEditingPoint(point.name) : setEditingPoint(null)
                  }
                >
                  <PopoverTrigger asChild>
                    <g
                      className="cursor-pointer hover:opacity-80"
                      onClick={() =>
                        onParamChange && setEditingPoint(point.name)
                      }
                    >
                      <ReferenceDot
                        x={point.v}
                        y={point.p}
                        r={6}
                        fill="#1A5F7A"
                        stroke="white"
                        strokeWidth={1.5}
                      />
                      {showStateLabels && (
                        <text
                          x={point.v}
                          y={point.p - 15}
                          textAnchor="middle"
                          fill="#333"
                          fontSize="12"
                          fontWeight="bold"
                        >
                          {point.name}
                        </text>
                      )}
                    </g>
                  </PopoverTrigger>
                  {onParamChange && (
                    <PopoverContent className="w-56 p-3 space-y-3 bg-white shadow-md border">
                      <h3 className="font-semibold">
                        Edit State Point {point.name}
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="press">Pressure (kPa)</Label>
                        <Input
                          id="press"
                          type="number"
                          value={editValues.p || point.p}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              p: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="flex justify-end space-x-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPoint(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            handlePointEdit(point.name, editValues)
                          }
                        >
                          Apply
                        </Button>
                      </div>
                    </PopoverContent>
                  )}
                </Popover>
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PVDiagram;
