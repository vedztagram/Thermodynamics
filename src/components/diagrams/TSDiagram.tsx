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
  ReferenceArea,
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

interface TSDiagramProps {
  cycleType: CycleType;
  cycleParams: CycleParams;
  onParamChange?: (params: Partial<CycleParams>) => void;
}

const TSDiagram = ({
  cycleType,
  cycleParams,
  onParamChange,
}: TSDiagramProps) => {
  const previousDataRef = useRef<any>(null);
  const [editingPoint, setEditingPoint] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ T?: number; p?: number }>({});
  const [showSettings, setShowSettings] = useState(false);
  const [showStateLabels, setShowStateLabels] = useState(true);
  const [showIsentropic, setShowIsentropic] = useState(true);
  const [visibleStatePoints, setVisibleStatePoints] = useState<
    Record<string, boolean>
  >({
    "1": true,
    "1s": true,
    "2": true,
    "2a": true,
    "3": true,
    "3a": true,
    "4": true,
    "4s": true,
    "5": true,
    "6": true,
  });

  // Generate T-S data based on cycle type and parameters
  const generateTSData = () => {
    try {
      const cycleData = calculateCycleStatePoints(cycleType, cycleParams);
      const points = Object.entries(cycleData.points).map(([key, point]) => ({
        name: key,
        s: point.s,
        T: point.T,
        p: point.p,
        h: point.h,
        v: point.v,
        x: point.x || undefined,
      }));

      // Sort points according to the cycle sequence
      const sortOrder: Record<string, number> = {
        "1": 0,
        "1s": 1,
        "2": 2,
        "2a": 3,
        "3": 4,
        "3a": 5,
        "4": 6,
        "4s": 7,
        "5": 8,
        "6": 9,
      };

      const sortedPoints = [...points].sort((a, b) => {
        return (sortOrder[a.name] || 0) - (sortOrder[b.name] || 0);
      });

      // For Brayton cycle, calculate and add isentropic points if they don't exist
      if (cycleType === "Brayton") {
        const gamma = cycleParams.gamma || 1.4;
        const R = cycleParams.R || 0.287;

        // Find the existing points
        const point1 = sortedPoints.find((p) => p.name === "1");
        const point2 = sortedPoints.find((p) => p.name === "2");
        const point3 = sortedPoints.find((p) => p.name === "3");
        const point4 = sortedPoints.find((p) => p.name === "4");

        if (point1 && point2 && !sortedPoints.find((p) => p.name === "1s")) {
          // Calculate ideal isentropic compression (1s)
          const p1 = point1.p || 100;
          const p2 = point2.p || 625;
          const T1 = point1.T || 300;

          // T2s = T1 × (P2/P1)^((γ−1)/γ)
          const T2s = T1 * Math.pow(p2 / p1, (gamma - 1) / gamma);

          // s1s = s1 (constant entropy)
          const s1 = point1.s || 0.5;

          // Add point 1s to the data
          sortedPoints.push({
            name: "1s",
            s: s1,
            T: T2s,
            p: p2,
            h: point1.h || 0,
            v: point1.v || 0,
            x: undefined,
          });
        }

        if (point3 && point4 && !sortedPoints.find((p) => p.name === "4s")) {
          // Calculate ideal isentropic expansion (4s)
          const p3 = point3.p || 625;
          const p4 = point4.p || 100;
          const T3 = point3.T || 1073;

          // T4s = T3 × (P4/P3)^((γ−1)/γ)
          const T4s = T3 * Math.pow(p4 / p3, (gamma - 1) / gamma);

          // s4s = s3 (constant entropy)
          const s3 = point3.s || 0.5;

          // Add point 4s to the data
          sortedPoints.push({
            name: "4s",
            s: s3,
            T: T4s,
            p: p4,
            h: point3.h || 0,
            v: point3.v || 0,
            x: undefined,
          });
        }

        // Resort after adding new points
        sortedPoints.sort((a, b) => {
          return (sortOrder[a.name] || 0) - (sortOrder[b.name] || 0);
        });
      }

      // Create the cycle line (only with main points, not 1s, 4s, etc.)
      const cycleLine = sortedPoints.filter((p) => !p.name.includes("s"));

      // Close the cycle by adding the first point at the end
      if (cycleLine.length > 0) {
        cycleLine.push({ ...cycleLine[0], name: "end" });
      }

      previousDataRef.current = {
        points: sortedPoints,
        cycleLine: cycleLine,
      };
      return previousDataRef.current;
    } catch (error) {
      console.error("Error generating TS data:", error);
      return previousDataRef.current || { points: [], cycleLine: [] };
    }
  };

  const data = generateTSData();

  // Find min and max values for axes with some padding
  const allPoints = data.points || [];
  const minS = Math.min(...allPoints.map((point) => point.s || 0)) * 0.9;
  const maxS = Math.max(...allPoints.map((point) => point.s || 0)) * 1.1;
  const minT = Math.min(...allPoints.map((point) => point.T || 0)) * 0.9;
  const maxT = Math.max(...allPoints.map((point) => point.T || 0)) * 1.1;

  // Handle parameter changes
  const handlePointEdit = (
    pointName: string,
    newValues: { T?: number; p?: number },
  ) => {
    if (!onParamChange) return;

    // Map state point changes to cycle parameters
    const paramUpdates: Partial<CycleParams> = {};

    // Based on which point is edited, update the appropriate parameters
    switch (pointName) {
      case "1":
        if (newValues.T) paramUpdates.T_low = newValues.T;
        if (newValues.p) paramUpdates.p_low = newValues.p;
        break;
      case "3":
      case "3a":
        if (newValues.T) paramUpdates.T_high = newValues.T;
        if (newValues.p) paramUpdates.p_high = newValues.p;
        break;
      // Add other point mappings as needed
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
          <p>{`Temperature: ${pointData.T?.toFixed(2) || "N/A"} K`}</p>
          <p>{`Entropy: ${pointData.s?.toFixed(4) || "N/A"} kJ/kg·K`}</p>
          <p>{`Pressure: ${pointData.p?.toFixed(2) || "N/A"} kPa`}</p>
          {pointData.h !== undefined && (
            <p>{`Enthalpy: ${pointData.h.toFixed(2)} kJ/kg`}</p>
          )}
          {pointData.v !== undefined && (
            <p>{`Volume: ${pointData.v.toFixed(6)} m³/kg`}</p>
          )}
          {pointData.x !== undefined && (
            <p>{`Quality: ${(pointData.x * 100).toFixed(1)}%`}</p>
          )}
          {pointData.name && pointData.name.includes("s") && (
            <p className="italic text-blue-600">Ideal isentropic state</p>
          )}
        </Card>
      );
    }
    return null;
  };

  // Create reference lines for engineering context
  const engineeringReferences = () => {
    // Get unique pressure and temperature values
    const pressures = [...new Set(allPoints.map((p) => p.p).filter(Boolean))];
    const temps = [...new Set(allPoints.map((p) => p.T).filter(Boolean))];

    return (
      <>
        {/* Isobaric lines (constant pressure) */}
        {pressures.map((p, idx) => (
          <Line
            key={`isobar-${idx}`}
            data={[
              { s: minS, T: allPoints.find((d) => d.p === p)?.T || 0 },
              { s: maxS * 0.9, T: allPoints.find((d) => d.p === p)?.T || 0 },
            ]}
            type="monotone"
            dataKey="T"
            stroke="#888"
            strokeWidth={0.5}
            strokeDasharray="2 2"
            dot={false}
            activeDot={false}
            label={false}
            isAnimationActive={false}
          />
        ))}

        {/* Isothermal lines (constant temperature) */}
        {temps.slice(0, 3).map((t, idx) => (
          <Line
            key={`isotherm-${idx}`}
            data={[
              { s: minS, T: t },
              { s: maxS, T: t },
            ]}
            type="monotone"
            dataKey="T"
            stroke="#888"
            strokeWidth={0.5}
            strokeDasharray="2 2"
            dot={false}
            activeDot={false}
            label={false}
            isAnimationActive={false}
          />
        ))}
      </>
    );
  };

  // Render isentropic process lines for Brayton cycle
  const renderIsentropicLines = () => {
    if (cycleType !== "Brayton" || !showIsentropic) return null;

    const point1 = allPoints.find((p) => p.name === "1");
    const point1s = allPoints.find((p) => p.name === "1s");
    const point3 = allPoints.find((p) => p.name === "3");
    const point4s = allPoints.find((p) => p.name === "4s");

    return (
      <>
        {/* Isentropic compression line 1-1s */}
        {point1 && point1s && (
          <Line
            data={[
              { s: point1.s, T: point1.T },
              { s: point1.s, T: point1s.T },
            ]}
            type="linear"
            dataKey="T"
            stroke="#3b82f6"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            dot={false}
            isAnimationActive={false}
          />
        )}

        {/* Isentropic expansion line 3-4s */}
        {point3 && point4s && (
          <Line
            data={[
              { s: point3.s, T: point3.T },
              { s: point3.s, T: point4s.T },
            ]}
            type="linear"
            dataKey="T"
            stroke="#3b82f6"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            dot={false}
            isAnimationActive={false}
          />
        )}
      </>
    );
  };

  // Function to check if a state point should be rendered
  const shouldRenderStatePoint = (pointName: string) => {
    // For isentropic states, only render if it's a Brayton cycle and show isentropic is true
    if (pointName.includes("s")) {
      return (
        cycleType === "Brayton" &&
        showIsentropic &&
        visibleStatePoints[pointName]
      );
    }

    // Don't render the closing point
    if (pointName === "end") {
      return false;
    }

    // Only render if it's visible in settings
    return visibleStatePoints[pointName] || false;
  };

  // Get dot color based on point name
  const getPointColor = (pointName: string) => {
    if (pointName.includes("s")) {
      return "#3b82f6"; // Blue for isentropic points
    }
    return "#159895"; // Default color
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">
          Temperature-Entropy (T-S) Diagram
        </h3>
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
                  id="show-labels-ts"
                  checked={showStateLabels}
                  onCheckedChange={(checked) => setShowStateLabels(!!checked)}
                />
                <Label htmlFor="show-labels-ts">Show State Point Labels</Label>
              </div>

              {cycleType === "Brayton" && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-isentropic"
                    checked={showIsentropic}
                    onCheckedChange={(checked) => setShowIsentropic(!!checked)}
                  />
                  <Label htmlFor="show-isentropic">
                    Show Ideal Isentropic States
                  </Label>
                </div>
              )}

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
                    .filter(
                      (key) =>
                        // For isentropic states, only show them for Brayton cycle
                        (key.includes("s") ? cycleType === "Brayton" : true) &&
                        // Only show points that actually exist in the data
                        allPoints.some((point) => point.name === key),
                    )
                    .sort((a, b) =>
                      a.localeCompare(b, undefined, { numeric: true }),
                    )
                    .map((key) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`state-ts-${key}`}
                          checked={visibleStatePoints[key]}
                          onCheckedChange={() => toggleStatePoint(key)}
                        />
                        <Label htmlFor={`state-ts-${key}`}>
                          State {key}
                          {key.includes("s") && (
                            <span className="text-xs text-blue-600">
                              {" "}
                              (Ideal)
                            </span>
                          )}
                        </Label>
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
          <LineChart>
            <defs>
              <linearGradient id="colorT" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#159895" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#159895" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="s"
              type="number"
              domain={[minS, maxS]}
              label={{
                value: "Specific Entropy (kJ/kg·K)",
                position: "insideBottom",
                offset: -5,
              }}
            />
            <YAxis
              dataKey="T"
              type="number"
              domain={[minT, maxT]}
              label={{
                value: "Temperature (K)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Reference engineering grid */}
            {engineeringReferences()}

            {/* Isentropic process lines */}
            {renderIsentropicLines()}

            {/* Actual cycle line */}
            <Line
              data={data.cycleLine || []}
              type="linear"
              dataKey="T"
              stroke="#159895"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={true}
              fill="url(#colorT)"
              connectNulls={true}
            />

            {/* Add reference dots for state points */}
            {allPoints
              .filter((point) => shouldRenderStatePoint(point.name))
              .map((point, index) => (
                <Popover
                  key={`point-${point.name}-${index}`}
                  open={editingPoint === point.name}
                  onOpenChange={(open) =>
                    open ? setEditingPoint(point.name) : setEditingPoint(null)
                  }
                >
                  <PopoverTrigger asChild>
                    <g
                      className="cursor-pointer hover:opacity-80"
                      onClick={() =>
                        onParamChange &&
                        !point.name.includes("s") &&
                        setEditingPoint(point.name)
                      }
                    >
                      <ReferenceDot
                        x={point.s}
                        y={point.T}
                        r={point.name.includes("s") ? 4 : 6}
                        fill={getPointColor(point.name)}
                        stroke="white"
                        strokeWidth={1.5}
                      />
                      {showStateLabels && (
                        <text
                          x={point.s}
                          y={point.T - 15}
                          textAnchor="middle"
                          fill={point.name.includes("s") ? "#3b82f6" : "#333"}
                          fontSize={point.name.includes("s") ? "10" : "12"}
                          fontWeight={
                            point.name.includes("s") ? "normal" : "bold"
                          }
                        >
                          {point.name}
                        </text>
                      )}
                    </g>
                  </PopoverTrigger>
                  {onParamChange && !point.name.includes("s") && (
                    <PopoverContent className="w-56 p-3 space-y-3 bg-white shadow-md border">
                      <h3 className="font-semibold">
                        Edit State Point {point.name}
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="temp">Temperature (K)</Label>
                        <Input
                          id="temp"
                          type="number"
                          value={editValues.T || point.T}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              T: Number(e.target.value),
                            })
                          }
                        />
                      </div>
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

export default TSDiagram;
