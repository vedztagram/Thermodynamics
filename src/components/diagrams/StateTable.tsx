import React from "react";
import { CycleType } from "@/lib/types";

const stageDescriptions: Record<CycleType, Record<string, string>> = {
  Otto: {
    "1-2": "Isentropic Compression",
    "2-3": "Constant Volume Heat Addition",
    "3-4": "Isentropic Expansion",
    "4-1": "Constant Volume Heat Rejection",
  },
  Diesel: {
    "1-2": "Isentropic Compression",
    "2-3": "Constant Pressure Heat Addition",
    "3-4": "Isentropic Expansion",
    "4-1": "Constant Volume Heat Rejection",
  },
  Brayton: {
    "1-2": "Non-Isentropic Compression",
    "1-1s": "Ideal Isentropic Compression",
    "2-3": "Constant Pressure Heat Addition",
    "3-4": "Non-Isentropic Expansion",
    "3-4s": "Ideal Isentropic Expansion",
    "4-1": "Constant Pressure Heat Rejection",
  },
  Rankine: {
    "1-2": "Isentropic Compression (Pump)",
    "2-3": "Constant Pressure Heat Addition (Boiler)",
    "3-4": "Isentropic Expansion (Turbine)",
    "4-1": "Constant Pressure Heat Rejection (Condenser)",
  },
};

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calculateCycleStatePoints } from "@/lib/thermodynamics";
import { CycleParams, StatePoint } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface StateTableProps {
  cycleType: CycleType;
  cycleParams: CycleParams;
}

const StateTable = ({ cycleType, cycleParams }: StateTableProps) => {
  const [statePoints, setStatePoints] = useState<Record<string, StatePoint>>(
    {},
  );
  const [cyclePerformance, setCyclePerformance] = useState<any>(null);
  const [showIdealStates, setShowIdealStates] = useState(true);

  useEffect(() => {
    try {
      const cycleData = calculateCycleStatePoints(cycleType, cycleParams);
      setStatePoints(cycleData.points);
      setCyclePerformance(cycleData.performance);
    } catch (error) {
      console.error("Error calculating state points:", error);
    }
  }, [cycleType, cycleParams]);

  const formatValue = (value: number | undefined, decimal: number = 2) => {
    if (value === undefined) return "-";
    return value.toFixed(decimal);
  };

  const getProcessName = (state: string, nextState: string): string => {
    return (
      stageDescriptions[cycleType][`${state}-${nextState}`] ||
      `${state}-${nextState}`
    );
  };

  const calculateEntropyChanges = () => {
    const changes: Record<string, number> = {};
    const stateArr = Object.entries(statePoints)
      .filter(([key]) => (!showIdealStates ? !key.includes("s") : true)) // Filter out ideal states if not showing them
      .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));

    for (let i = 0; i < stateArr.length; i++) {
      const currentState = stateArr[i];
      const nextState = stateArr[(i + 1) % stateArr.length];

      const sChange = nextState[1].s - currentState[1].s;
      changes[`${currentState[0]}-${nextState[0]}`] = sChange;
    }

    return changes;
  };

  const entropyChanges = calculateEntropyChanges();

  const exportCsv = () => {
    const headers = [
      "State",
      "Process",
      "P (kPa)",
      "T (K)",
      "v (m³/kg)",
      "h (kJ/kg)",
      "s (kJ/kg·K)",
    ];
    const rows = Object.entries(statePoints)
      .filter(([key]) => (!showIdealStates ? !key.includes("s") : true)) // Filter out ideal states if not showing them
      .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
      .map(([state, point], index, array) => {
        let process = "";
        if (index < array.length - 1) {
          const nextState = array[index + 1][0];
          process = getProcessName(state, nextState);
        }

        return [
          state,
          process,
          point.p.toFixed(2),
          point.T.toFixed(2),
          point.v.toFixed(5),
          point.h.toFixed(2),
          point.s.toFixed(4),
        ];
      });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${cycleType}_cycle_data.csv`);
    link.click();
  };

  const formatPercentage = (value: number) => {
    return (value * 100).toFixed(2) + "%";
  };

  // Get row style based on whether it's an ideal state point
  const getRowStyle = (state: string) => {
    if (state.includes("s")) {
      return "bg-blue-50";
    }
    return "";
  };

  return (
    <div className="w-full h-full overflow-auto flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">State Points Data Table</h3>
        <div className="flex items-center gap-4">
          {cycleType === "Brayton" && (
            <div className="flex items-center space-x-2">
              <Switch
                id="show-ideal-states"
                checked={showIdealStates}
                onCheckedChange={setShowIdealStates}
              />
              <Label htmlFor="show-ideal-states">Show Ideal States</Label>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">State</TableHead>
                <TableHead>Process</TableHead>
                <TableHead>P (kPa)</TableHead>
                <TableHead>T (K)</TableHead>
                <TableHead>v (m³/kg)</TableHead>
                <TableHead>h (kJ/kg)</TableHead>
                <TableHead>s (kJ/kg·K)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(statePoints)
                .filter(([key]) =>
                  !showIdealStates ? !key.includes("s") : true,
                ) // Filter out ideal states if not showing them
                .sort((a, b) =>
                  a[0].localeCompare(b[0], undefined, { numeric: true }),
                )
                .map(([state, point], index, array) => {
                  let process = "";
                  let nextState = "";

                  // Find next state for process name
                  if (index < array.length - 1) {
                    nextState = array[index + 1][0];
                    process = getProcessName(state, nextState);
                  }

                  const processKey = nextState ? `${state}-${nextState}` : "";

                  return (
                    <TableRow key={state} className={getRowStyle(state)}>
                      <TableCell className="font-medium">
                        {state}
                        {state.includes("s") && (
                          <span className="text-xs text-blue-500 ml-1">
                            (Ideal)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{process}</TableCell>
                      <TableCell>{formatValue(point.p)}</TableCell>
                      <TableCell>{formatValue(point.T)}</TableCell>
                      <TableCell>{formatValue(point.v, 5)}</TableCell>
                      <TableCell>{formatValue(point.h)}</TableCell>
                      <TableCell>{formatValue(point.s, 4)}</TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Separator />

      <Card className="mt-4">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium mb-3">Entropy Changes</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Process</TableHead>
                <TableHead>Δs (kJ/kg·K)</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(entropyChanges).map(([process, delta]) => (
                <TableRow
                  key={process}
                  className={process.includes("s") ? "bg-blue-50" : ""}
                >
                  <TableCell className="font-medium">{process}</TableCell>
                  <TableCell>{formatValue(delta, 4)}</TableCell>
                  <TableCell>
                    {delta > 0
                      ? "Heat added to system"
                      : delta < 0
                        ? "Heat rejected from system"
                        : "Isentropic process (no entropy change)"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {cyclePerformance && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-3">Performance Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground">
                  Thermal Efficiency
                </h4>
                <p className="text-lg font-bold">
                  {formatPercentage(cyclePerformance.efficiency)}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground">
                  Net Work
                </h4>
                <p className="text-lg font-bold">
                  {formatValue(cyclePerformance.work_net)} kJ/kg
                </p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground">
                  Heat Input
                </h4>
                <p className="text-lg font-bold">
                  {formatValue(cyclePerformance.heat_input)} kJ/kg
                </p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground">
                  Heat Rejected
                </h4>
                <p className="text-lg font-bold">
                  {formatValue(cyclePerformance.heat_rejected)} kJ/kg
                </p>
              </div>
            </div>

            {cycleType === "Brayton" && cyclePerformance.efficiency_ideal && (
              <>
                <Separator className="my-4" />
                <h3 className="text-sm font-medium mb-3">
                  Ideal vs. Actual Comparison
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground">
                      Ideal Efficiency
                    </h4>
                    <p className="text-lg font-bold text-blue-600">
                      {formatPercentage(cyclePerformance.efficiency_ideal)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground">
                      Efficiency Loss
                    </h4>
                    <p className="text-lg font-bold text-red-500">
                      {formatPercentage(
                        cyclePerformance.efficiency_ideal -
                          cyclePerformance.efficiency,
                      )}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground">
                      Back Work Ratio
                    </h4>
                    <p className="text-lg font-bold">
                      {formatPercentage(cyclePerformance.back_work_ratio)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground">
                      Relative Efficiency
                    </h4>
                    <p className="text-lg font-bold">
                      {formatPercentage(
                        cyclePerformance.efficiency /
                          cyclePerformance.efficiency_ideal,
                      )}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StateTable;
