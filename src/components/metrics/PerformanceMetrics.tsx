import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateCycleStatePoints } from "@/lib/thermodynamics";
import { CycleType, CycleParams, CycleState } from "@/lib/types";
import {
  CirclePlus,
  CircleMinus,
  CircleEqual,
  PercentIcon,
  Scale,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowRightCircle,
  Zap,
  Thermometer,
  Gauge,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface PerformanceMetricsProps {
  cycleType: CycleType;
  cycleParams: CycleParams;
}

const MetricItem = ({
  icon,
  label,
  value,
  unit,
  color = "text-primary",
  description,
  precision = 2,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit: string;
  color?: string;
  description?: string;
  precision?: number;
  highlight?: boolean;
}) => {
  // Ensure value is properly formatted even if it's undefined or null
  const displayValue =
    typeof value === "number"
      ? value.toFixed(precision)
      : typeof value === "string"
        ? value
        : "0.00";

  return (
    <div
      className={`flex items-center space-x-4 p-3 border rounded-md transition-colors ${highlight ? "bg-green-50 border-green-200" : "hover:bg-slate-50"}`}
    >
      <div className={`${color} p-2 rounded-full bg-gray-50`}>{icon}</div>
      <div className="flex-grow">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{label}</p>
          <p
            className={`text-lg font-semibold ${highlight ? "text-green-700" : ""}`}
          >
            {displayValue} <span className="text-sm text-gray-500">{unit}</span>
          </p>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  );
};

const PerformanceMetrics = ({
  cycleType,
  cycleParams,
}: PerformanceMetricsProps) => {
  const [cyclePerformance, setCyclePerformance] = useState<
    CycleState["performance"] | null
  >(null);
  const [cyclePoints, setCyclePoints] = useState<CycleState["points"] | null>(
    null,
  );
  const [isExactMatch, setIsExactMatch] = useState(false);

  useEffect(() => {
    try {
      const cycleData = calculateCycleStatePoints(cycleType, cycleParams);
      setCyclePerformance(cycleData.performance);
      setCyclePoints(cycleData.points);

      // Check if this matches the numerical example for Brayton cycle
      if (cycleType === "Brayton") {
        const isExampleMatch =
          Math.abs((cycleData.points["2"]?.T || 0) - 706.1) < 0.5 && // T2 ≈ 706.1K
          Math.abs((cycleData.points["4"]?.T || 0) - 424.9) < 0.5 && // T4 ≈ 424.9K
          Math.abs((cycleData.performance.heat_input || 0) - 295.4) < 0.5 && // qin ≈ 295.4 kJ/kg
          Math.abs((cycleData.performance.heat_rejected || 0) - 125.5) < 0.5 && // qout ≈ 125.5 kJ/kg
          Math.abs((cycleData.performance.work_net || 0) - 169.9) < 0.5 && // wnet ≈ 169.9 kJ/kg
          Math.abs((cycleData.performance.efficiency || 0) - 0.575) < 0.01; // η ≈ 0.575 (57.5%)

        setIsExactMatch(isExampleMatch);
      } else {
        setIsExactMatch(false);
      }
    } catch (error) {
      console.error("Error calculating cycle performance:", error);
      // Reset state to prevent rendering with partial/invalid data
      setCyclePerformance(null);
      setCyclePoints(null);
      setIsExactMatch(false);
    }
  }, [cycleType, cycleParams]);

  // Format efficiency as percentage with proper null check
  const formatEfficiency = (efficiency: number | undefined) => {
    if (efficiency === undefined || efficiency === null) return "0.00";
    return (efficiency * 100).toFixed(2);
  };

  // Get theoretical maximum efficiency for the cycle type with proper null check
  const getTheoreticalMaximumEfficiency = () => {
    if (!cyclePoints) return 0;

    try {
      switch (cycleType) {
        case "Otto":
          // η_max = 1 - 1/r^(γ-1) where r is compression ratio
          const r = cycleParams.compression_ratio || 8;
          const gamma = cycleParams.gamma || 1.4;
          return 1 - Math.pow(1 / r, gamma - 1);

        case "Diesel":
          // More complex formula for Diesel cycle
          // η = 1 - (1/r^(γ-1)) * (r_c^γ - 1)/(γ * (r_c - 1))
          const rd = cycleParams.compression_ratio || 18;
          const rc = cycleParams.cutoff_ratio || 2;
          const gammad = cycleParams.gamma || 1.4;
          return (
            1 -
            ((1 / Math.pow(rd, gammad - 1)) * (Math.pow(rc, gammad) - 1)) /
              (gammad * (rc - 1))
          );

        case "Brayton":
          // η_max = 1 - 1/r_p^((γ-1)/γ) where r_p is pressure ratio
          const rp = cycleParams.pressure_ratio || 20; // Updated to 20 for our example
          const gammab = cycleParams.gamma || 1.4;
          return 1 - Math.pow(1 / rp, (gammab - 1) / gammab);

        case "Rankine":
          // Simple approximation for Rankine cycle
          return 0.4; // 40% theoretical maximum for a typical Rankine cycle

        default:
          return 0;
      }
    } catch (error) {
      console.error("Error calculating theoretical efficiency:", error);
      return 0;
    }
  };

  // Get Carnot efficiency based on temperature with proper null check
  const getCarnotEfficiency = () => {
    if (!cyclePoints || Object.keys(cyclePoints).length === 0) return 0;

    try {
      const temperatures = Object.values(cyclePoints)
        .map((p) => p?.T || 0)
        .filter((t) => t > 0);

      if (temperatures.length === 0) return 0;

      const T_high = Math.max(...temperatures);
      const T_low = Math.min(...temperatures);

      if (T_low <= 0 || T_high <= 0 || T_high === T_low) return 0;

      return 1 - T_low / T_high;
    } catch (error) {
      console.error("Error calculating Carnot efficiency:", error);
      return 0;
    }
  };

  // Get detailed description for each cycle type
  const getCycleDescription = () => {
    const descriptions = {
      Otto: "The Otto cycle represents spark-ignition engines with combustion at constant volume. Higher compression ratios increase efficiency but are limited by knock.",
      Diesel:
        "The Diesel cycle models compression-ignition engines with combustion at constant pressure. They typically have higher compression ratios than Otto cycle engines.",
      Brayton:
        "The Brayton cycle represents gas turbines and jet engines. The cycle consists of isentropic compression, constant pressure heat addition, isentropic expansion, and constant pressure heat rejection.",
      Rankine:
        "The Rankine cycle is used in steam power plants. It consists of isentropic compression, constant pressure heat addition, isentropic expansion, and constant pressure heat rejection.",
    };

    return descriptions[cycleType] || "";
  };

  // Get efficiency comparison with proper null checks
  const getEfficiencyComparison = () => {
    if (!cyclePerformance || cyclePerformance.efficiency === undefined)
      return { ratio: 0, text: "" };

    const maxEff = getTheoreticalMaximumEfficiency();
    const actualEff = cyclePerformance.efficiency;

    // Prevent division by zero
    const ratio = maxEff > 0 ? actualEff / maxEff : 0;

    let text = "";
    if (ratio > 0.9) {
      text = "Excellent - Very close to theoretical maximum";
    } else if (ratio > 0.8) {
      text = "Good - Approaching theoretical limit";
    } else if (ratio > 0.6) {
      text = "Moderate - Room for improvement";
    } else {
      text = "Low - Consider optimizing parameters";
    }

    return { ratio, text };
  };

  // Safe access to values with fallbacks
  const efficiencyComparison = cyclePerformance
    ? getEfficiencyComparison()
    : { ratio: 0, text: "" };
  const carnotEfficiency = getCarnotEfficiency();
  const theoreticalEfficiency = getTheoreticalMaximumEfficiency();

  // Get numerical example-specific values
  const getNumericalExampleValues = () => {
    if (cycleType !== "Brayton") return null;

    return {
      T1: 300, // K (27°C)
      T2: 706.1, // K
      T3: 1000, // K (727°C)
      T4: 424.9, // K
      p1: 100, // kPa
      p2: 2000, // kPa
      qin: 295.4, // kJ/kg
      qout: 125.5, // kJ/kg
      wnet: 169.9, // kJ/kg
      efficiency: 0.575, // 57.5%
    };
  };

  const numericalExample = getNumericalExampleValues();

  return (
    <Card className="h-full overflow-auto">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Cycle Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isExactMatch && cycleType === "Brayton" && (
          <Alert className="bg-green-50 border-green-200 mb-4">
            <InfoIcon className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Current parameters match the numerical example problem. Results
              should be exactly as calculated in the example.
            </AlertDescription>
          </Alert>
        )}

        {cyclePerformance && cyclePoints ? (
          <>
            <MetricItem
              icon={<PercentIcon className="h-5 w-5" />}
              label="Thermal Efficiency"
              value={formatEfficiency(cyclePerformance.efficiency)}
              unit="%"
              color="text-blue-600"
              description="Ratio of net work output to heat input"
              highlight={
                cycleType === "Brayton" &&
                Math.abs((cyclePerformance.efficiency || 0) - 0.575) < 0.01
              }
            />

            <div className="p-3 border rounded-md">
              <p className="text-sm text-gray-500 mb-1">
                Efficiency Comparison
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Current</span>
                  <span>{formatEfficiency(cyclePerformance.efficiency)}%</span>
                </div>
                <Progress
                  value={(cyclePerformance.efficiency || 0) * 100}
                  className="h-2"
                />

                <div className="flex justify-between text-xs">
                  <span>Theoretical Max</span>
                  <span>{formatEfficiency(theoreticalEfficiency)}%</span>
                </div>
                <Progress
                  value={theoreticalEfficiency * 100}
                  className="h-2 bg-gray-200"
                />

                <div className="flex justify-between text-xs">
                  <span>Carnot</span>
                  <span>{formatEfficiency(carnotEfficiency)}%</span>
                </div>
                <Progress
                  value={carnotEfficiency * 100}
                  className="h-2 bg-gray-200"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {efficiencyComparison.text}
              </p>
            </div>

            <MetricItem
              icon={<CircleEqual className="h-5 w-5" />}
              label="Net Work"
              value={cyclePerformance.work_net || 0}
              unit="kJ/kg"
              color="text-teal-600"
              description="Total useful work produced per kg of working fluid"
              precision={1}
              highlight={
                cycleType === "Brayton" &&
                Math.abs((cyclePerformance.work_net || 0) - 169.9) < 0.5
              }
            />

            <MetricItem
              icon={<CirclePlus className="h-5 w-5" />}
              label="Heat Input"
              value={cyclePerformance.heat_input || 0}
              unit="kJ/kg"
              color="text-red-600"
              description="Heat energy added during the cycle"
              precision={1}
              highlight={
                cycleType === "Brayton" &&
                Math.abs((cyclePerformance.heat_input || 0) - 295.4) < 0.5
              }
            />

            <MetricItem
              icon={<CircleMinus className="h-5 w-5" />}
              label="Heat Rejected"
              value={cyclePerformance.heat_rejected || 0}
              unit="kJ/kg"
              color="text-cyan-600"
              description="Waste heat released during the cycle"
              precision={1}
              highlight={
                cycleType === "Brayton" &&
                Math.abs((cyclePerformance.heat_rejected || 0) - 125.5) < 0.5
              }
            />

            {cycleType === "Brayton" && (
              <>
                <Separator />

                <MetricItem
                  icon={<ArrowUpCircle className="h-5 w-5" />}
                  label="Compressor Work"
                  value={cyclePerformance.work_compressor?.toFixed(1) || "0.0"}
                  unit="kJ/kg"
                  color="text-indigo-600"
                  description="Work required to compress the working fluid"
                  highlight={false}
                />

                <MetricItem
                  icon={<ArrowDownCircle className="h-5 w-5" />}
                  label="Turbine Work"
                  value={cyclePerformance.work_turbine?.toFixed(1) || "0.0"}
                  unit="kJ/kg"
                  color="text-orange-600"
                  description="Work produced by the turbine expansion"
                  highlight={false}
                />

                <MetricItem
                  icon={<ArrowRightCircle className="h-5 w-5" />}
                  label="Pressure Ratio"
                  value={cycleParams.pressure_ratio?.toFixed(1) || "0.0"}
                  unit=""
                  color="text-violet-600"
                  description="Ratio of maximum to minimum pressure (p₂/p₁)"
                  highlight={cycleParams.pressure_ratio === 20}
                />
              </>
            )}

            <Separator />

            <MetricItem
              icon={<Thermometer className="h-5 w-5" />}
              label="Max Temperature"
              value={cyclePoints["3"]?.T || 0}
              unit="K"
              color="text-rose-600"
              description={`${((cyclePoints["3"]?.T || 0) - 273).toFixed(0)}°C at state point 3`}
              precision={1}
              highlight={
                cycleType === "Brayton" &&
                Math.abs((cyclePoints["3"]?.T || 0) - 1000) < 0.5
              }
            />

            <MetricItem
              icon={<Gauge className="h-5 w-5" />}
              label="Max Pressure"
              value={
                Math.max(...Object.values(cyclePoints).map((p) => p?.p || 0)) ||
                0
              }
              unit="kPa"
              color="text-emerald-600"
              description="Maximum pressure in the cycle"
              precision={0}
              highlight={
                cycleType === "Brayton" &&
                Math.abs(
                  Math.max(
                    ...Object.values(cyclePoints).map((p) => p?.p || 0),
                  ) - 2000,
                ) < 0.5
              }
            />

            {(cyclePerformance.mass_flow || cyclePerformance.power_output) && (
              <>
                <MetricItem
                  icon={<Scale className="h-5 w-5" />}
                  label="Mass Flow Rate"
                  value={cyclePerformance.mass_flow || 0}
                  unit="kg/s"
                  color="text-yellow-600"
                  description="Required flow rate for desired power output"
                  precision={1}
                />

                <MetricItem
                  icon={<Zap className="h-5 w-5" />}
                  label="Power Output"
                  value={cyclePerformance.power_output || 0}
                  unit="MW"
                  color="text-purple-600"
                  description="Total mechanical/electrical power produced"
                  precision={1}
                />
              </>
            )}
          </>
        ) : (
          <p className="text-center text-gray-500">
            Loading performance data...
          </p>
        )}

        <Separator />

        <div className="pt-4">
          <h4 className="text-sm font-medium mb-2">Cycle Information</h4>
          <p className="text-sm text-gray-600">{getCycleDescription()}</p>

          {cycleType === "Otto" && (
            <div className="mt-3 text-sm text-gray-600">
              <p className="font-medium">Key Equations:</p>
              <p className="font-mono text-xs mt-1">η = 1 - 1/r^(γ-1)</p>
              <p className="font-mono text-xs mt-1">T₂ = T₁ * r^(γ-1)</p>
              <p className="font-mono text-xs mt-1">p₂ = p₁ * r^γ</p>
            </div>
          )}

          {cycleType === "Diesel" && (
            <div className="mt-3 text-sm text-gray-600">
              <p className="font-medium">Key Equations:</p>
              <p className="font-mono text-xs mt-1">
                η = 1 - (1/r^(γ-1))*((r_c^γ-1)/(γ*(r_c-1)))
              </p>
              <p className="font-mono text-xs mt-1">T₂ = T₁ * r^(γ-1)</p>
              <p className="font-mono text-xs mt-1">T₃ = T₂ * r_c</p>
            </div>
          )}

          {cycleType === "Brayton" && (
            <div className="mt-3 text-sm text-gray-600">
              <p className="font-medium">Key Equations:</p>
              <p className="font-mono text-xs mt-1">
                T₂ = T₁ * (p₂/p₁)^((γ-1)/γ)
              </p>
              <p className="font-mono text-xs mt-1">
                T₄ = T₃ * (p₄/p₃)^((γ-1)/γ)
              </p>
              <p className="font-mono text-xs mt-1">q_in = cp * (T₃ - T₂)</p>
              <p className="font-mono text-xs mt-1">q_out = cp * (T₄ - T₁)</p>
              <p className="font-mono text-xs mt-1">w_net = q_in - q_out</p>
              <p className="font-mono text-xs mt-1">η = w_net / q_in</p>
            </div>
          )}

          {cycleType === "Rankine" && (
            <div className="mt-3 text-sm text-gray-600">
              <p className="font-medium">Key Equations:</p>
              <p className="font-mono text-xs mt-1">
                η = (h₃ - h₄) / (h₃ - h₂)
              </p>
              <p className="font-mono text-xs mt-1">w_pump = v₁ * (p₂ - p₁)</p>
              <p className="font-mono text-xs mt-1">q_in = h₃ - h₂</p>
            </div>
          )}

          {isExactMatch && cycleType === "Brayton" && numericalExample && (
            <div className="mt-3 p-3 border rounded-md bg-green-50 border-green-200">
              <p className="font-medium text-green-800">
                Numerical Example Results:
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                <p className="font-mono text-xs">T₁ = 300 K (27°C)</p>
                <p className="font-mono text-xs">T₂ = 706.1 K</p>
                <p className="font-mono text-xs">T₃ = 1000 K (727°C)</p>
                <p className="font-mono text-xs">T₄ = 424.9 K</p>
                <p className="font-mono text-xs">p₁ = 100 kPa</p>
                <p className="font-mono text-xs">p₂ = 2000 kPa</p>
                <p className="font-mono text-xs">q_in = 295.4 kJ/kg</p>
                <p className="font-mono text-xs">q_out = 125.5 kJ/kg</p>
                <p className="font-mono text-xs">w_net = 169.9 kJ/kg</p>
                <p className="font-mono text-xs">η = 57.5%</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetrics;
