import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { CycleType, CycleParams } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ParameterControlsProps {
  cycleType: CycleType;
  cycleParams: CycleParams;
  onParamChange: (newParams: Partial<CycleParams>) => void;
}

interface ParameterConfig {
  key: keyof CycleParams;
  label: string;
  tooltip: string;
  defaultValue: number;
  unit: string;
  format: (value: number) => string;
  required?: boolean;
}

const ParameterControls = ({
  cycleType,
  cycleParams,
  onParamChange,
}: ParameterControlsProps) => {
  const [localParams, setLocalParams] = useState<CycleParams>(cycleParams);
  const [showAdvancedParams, setShowAdvancedParams] = useState(false);
  const [pressureInputMode, setPressureInputMode] = useState<
    "ratio" | "direct"
  >("direct"); // Default to direct for the numerical problem
  const [notGivenParams, setNotGivenParams] = useState<Record<string, boolean>>(
    {},
  );
  const [predefinedExample, setPredefinedExample] = useState(false);

  useEffect(() => {
    setLocalParams(cycleParams);
  }, [cycleParams]);

  const form = useForm({
    defaultValues: {
      pressureMode: pressureInputMode,
    },
  });

  useEffect(() => {
    if (pressureInputMode === "direct" && localParams.p_1 && localParams.p_2) {
      const calculatedRatio = localParams.p_2 / localParams.p_1;
      if (calculatedRatio !== localParams.pressure_ratio) {
        handleParamChange("pressure_ratio", calculatedRatio);
      }
    }
  }, [pressureInputMode, localParams.p_1, localParams.p_2]);

  const cycleSpecificParameters: Record<CycleType, ParameterConfig[]> = {
    Otto: [
      {
        key: "p_1",
        label: "Initial Pressure (P₁)",
        tooltip: "Initial pressure in the cycle",
        defaultValue: 100,
        unit: "kPa",
        format: (val) => val.toFixed(0),
      },
      {
        key: "T_1",
        label: "Initial Temperature (T₁)",
        tooltip: "Initial temperature in the cycle",
        defaultValue: 300,
        unit: "K",
        format: (val) => val.toFixed(0),
      },
      {
        key: "compression_ratio",
        label: "Compression Ratio (r)",
        tooltip: "Ratio of maximum to minimum volume",
        defaultValue: 8,
        unit: "",
        format: (val) => val.toFixed(1),
      },
      {
        key: "heat_input",
        label: "Heat Added (Qₙ)",
        tooltip: "Amount of heat added to the cycle",
        defaultValue: 800,
        unit: "kJ/kg",
        format: (val) => val.toFixed(0),
      },
      {
        key: "T_3",
        label: "Maximum Temperature (T₃)",
        tooltip: "Temperature at end of heat addition",
        defaultValue: 1500,
        unit: "K",
        format: (val) => val.toFixed(0),
      },
      {
        key: "v_1",
        label: "Initial Volume (V₁)",
        tooltip: "Initial volume before compression",
        defaultValue: 0.004,
        unit: "m³",
        format: (val) => val.toFixed(4),
      },
      {
        key: "gamma",
        label: "Ratio of Specific Heats (γ)",
        tooltip: "Typically 1.4 for air",
        defaultValue: 1.4,
        unit: "",
        format: (val) => val.toFixed(2),
      },
      {
        key: "cv",
        label: "Specific Heat at Constant Volume (Cv)",
        tooltip: "Typically 0.718 kJ/kg·K for air",
        defaultValue: 0.718,
        unit: "kJ/kg·K",
        format: (val) => val.toFixed(3),
      },
      {
        key: "cp",
        label: "Specific Heat at Constant Pressure (Cp)",
        tooltip: "Typically 1.005 kJ/kg·K for air",
        defaultValue: 1.005,
        unit: "kJ/kg·K",
        format: (val) => val.toFixed(3),
      },
      {
        key: "R",
        label: "Gas Constant (R)",
        tooltip: "R = Cp - Cv, typically 0.287 kJ/kg·K",
        defaultValue: 0.287,
        unit: "kJ/kg·K",
        format: (val) => val.toFixed(3),
      },
    ],

    Diesel: [
      {
        key: "p_1",
        label: "Initial Pressure (P₁)",
        tooltip: "Initial pressure before compression",
        defaultValue: 100,
        unit: "kPa",
        format: (val) => val.toFixed(0),
      },
      {
        key: "T_1",
        label: "Initial Temperature (T₁)",
        tooltip: "Initial temperature before compression",
        defaultValue: 300,
        unit: "K",
        format: (val) => val.toFixed(0),
      },
      {
        key: "compression_ratio",
        label: "Compression Ratio (r)",
        tooltip: "Ratio of maximum to minimum volume",
        defaultValue: 18,
        unit: "",
        format: (val) => val.toFixed(1),
      },
      {
        key: "cutoff_ratio",
        label: "Cutoff Ratio (rc)",
        tooltip: "Volume ratio during constant pressure heat addition",
        defaultValue: 2.0,
        unit: "",
        format: (val) => val.toFixed(1),
      },
      {
        key: "heat_input",
        label: "Heat Added (Qₙ)",
        tooltip: "Heat added during the cycle",
        defaultValue: 900,
        unit: "kJ/kg",
        format: (val) => val.toFixed(0),
      },
      {
        key: "T_3",
        label: "Maximum Temperature (T₃)",
        tooltip: "Maximum temperature after heat addition",
        defaultValue: 1800,
        unit: "K",
        format: (val) => val.toFixed(0),
      },
      {
        key: "v_1",
        label: "Initial Volume (V₁)",
        tooltip: "Initial volume before compression",
        defaultValue: 0.004,
        unit: "m³",
        format: (val) => val.toExponential(2),
      },
      {
        key: "gamma",
        label: "Ratio of Specific Heats (γ)",
        tooltip: "Typically 1.4 for air",
        defaultValue: 1.4,
        unit: "",
        format: (val) => val.toFixed(2),
      },
      {
        key: "cv",
        label: "Specific Heat at Constant Volume (Cv)",
        tooltip: "Typically 0.718 kJ/kg·K for air",
        defaultValue: 0.718,
        unit: "kJ/kg·K",
        format: (val) => val.toFixed(3),
      },
      {
        key: "cp",
        label: "Specific Heat at Constant Pressure (Cp)",
        tooltip: "Typically 1.005 kJ/kg·K for air",
        defaultValue: 1.005,
        unit: "kJ/kg·K",
        format: (val) => val.toFixed(3),
      },
      {
        key: "R",
        label: "Gas Constant (R)",
        tooltip: "R = Cp - Cv, typically 0.287 kJ/kg·K",
        defaultValue: 0.287,
        unit: "kJ/kg·K",
        format: (val) => val.toFixed(3),
      },
    ],

    Brayton: [
      {
        key: "T_1",
        label: "Minimum Temperature (T₁)",
        tooltip: "Minimum temperature in the cycle (27°C = 300K)",
        defaultValue: 300,
        unit: "K",
        format: (val) => val.toFixed(0),
        required: true,
      },
      {
        key: "T_3",
        label: "Maximum Temperature (T₃)",
        tooltip:
          "Maximum temperature in the cycle after combustion (727°C = 1000K)",
        defaultValue: 1000,
        unit: "K",
        format: (val) => val.toFixed(0),
        required: true,
      },
      {
        key: "p_1",
        label: "Minimum Pressure (p₁)",
        tooltip: "Minimum pressure in the cycle, typically at compressor inlet",
        defaultValue: 100,
        unit: "kPa",
        format: (val) => val.toFixed(0),
        required: false,
      },
      {
        key: "cp",
        label: "Specific Heat (cp)",
        tooltip:
          "Specific heat at constant pressure for air at room temperature",
        defaultValue: 1.005,
        unit: "kJ/kg·K",
        format: (val) => val.toFixed(3),
        required: true,
      },
      {
        key: "gamma",
        label: "Ratio of Specific Heats (γ)",
        tooltip:
          "Ratio of specific heat at constant pressure to constant volume for air",
        defaultValue: 1.4,
        unit: "",
        format: (val) => val.toFixed(2),
        required: true,
      },
      {
        key: "mass_flow",
        label: "Mass Flow Rate (optional)",
        tooltip: "Mass flow rate of air through the cycle",
        defaultValue: 100,
        unit: "kg/s",
        format: (val) => val.toFixed(1),
      },
      {
        key: "power_output",
        label: "Power Output (optional)",
        tooltip: "Desired power output of the cycle",
        defaultValue: 70,
        unit: "MW",
        format: (val) => val.toFixed(0),
      },
    ],
    Rankine: [
      {
        key: "T_1",
        label: "Condenser Temperature (T₁)",
        tooltip: "Temperature at which steam condenses",
        defaultValue: 318,
        unit: "K",
        format: (val) => val.toFixed(0),
      },
      {
        key: "p_1",
        label: "Condenser Pressure (p₁)",
        tooltip: "Pressure in the condenser",
        defaultValue: 10,
        unit: "kPa",
        format: (val) => val.toFixed(0),
      },
      {
        key: "p_2",
        label: "Boiler Pressure (p₂)",
        tooltip: "Maximum pressure in the cycle",
        defaultValue: 10000,
        unit: "kPa",
        format: (val) => val.toFixed(0),
      },
      {
        key: "T_3",
        label: "Maximum Temperature (T₃)",
        tooltip: "Maximum temperature in the cycle",
        defaultValue: 673,
        unit: "K",
        format: (val) => val.toFixed(0),
      },
      {
        key: "eta_pump",
        label: "Pump Efficiency",
        tooltip: "Isentropic efficiency of the pump",
        defaultValue: 0.85,
        unit: "",
        format: (val) => (val * 100).toFixed(0) + "%",
      },
      {
        key: "eta_turbine",
        label: "Turbine Efficiency",
        tooltip: "Isentropic efficiency of the turbine",
        defaultValue: 0.87,
        unit: "",
        format: (val) => (val * 100).toFixed(0) + "%",
      },
      {
        key: "superheater_temp_increase",
        label: "Superheat",
        tooltip: "Temperature increase in superheater",
        defaultValue: 150,
        unit: "K",
        format: (val) => val.toFixed(0),
      },
      {
        key: "power_output",
        label: "Power Output (optional)",
        tooltip: "Desired power output of the cycle",
        defaultValue: 100,
        unit: "MW",
        format: (val) => val.toFixed(0),
      },
    ],
  };

  const pressureRatioParameter: ParameterConfig = {
    key: "pressure_ratio",
    label: "Pressure Ratio",
    tooltip: "Ratio of maximum to minimum pressure (p₂/p₁)",
    defaultValue: 20,
    unit: "",
    format: (val) => val.toFixed(2),
    required: true,
  };

  const directPressureParameter: ParameterConfig = {
    key: "p_2",
    label: "Maximum Pressure (p₂)",
    tooltip: "Maximum pressure in the cycle, at compressor outlet",
    defaultValue: 2000,
    unit: "kPa",
    format: (val) => val.toFixed(0),
    required: true,
  };

  const advancedBraytonParameters: ParameterConfig[] = [
    {
      key: "eta_compressor",
      label: "Compressor Efficiency",
      tooltip:
        "Isentropic efficiency of the compressor (1.0 = 100%, ideal cycle)",
      defaultValue: 1.0,
      unit: "",
      format: (val) => (val * 100).toFixed(0) + "%",
    },
    {
      key: "eta_turbine",
      label: "Turbine Efficiency",
      tooltip: "Isentropic efficiency of the turbine (1.0 = 100%, ideal cycle)",
      defaultValue: 1.0,
      unit: "",
      format: (val) => (val * 100).toFixed(0) + "%",
    },
  ];

  const getParameters = (cycleType: CycleType): ParameterConfig[] => {
    if (cycleType === "Brayton") {
      const params = [...cycleSpecificParameters[cycleType]];

      if (pressureInputMode === "ratio") {
        const p1Index = params.findIndex((p) => p.key === "p_1");
        if (p1Index >= 0) {
          params[p1Index] = { ...params[p1Index], required: false };
        }

        params.splice(3, 0, pressureRatioParameter);
      } else {
        const p1Index = params.findIndex((p) => p.key === "p_1");
        if (p1Index >= 0) {
          params[p1Index] = { ...params[p1Index], required: true };
        }

        params.splice(3, 0, directPressureParameter);
      }

      return params;
    }

    return cycleSpecificParameters[cycleType] || [];
  };

  const handleParamChange = (key: keyof CycleParams, value: number) => {
    if (notGivenParams[key as string]) {
      const newNotGiven = { ...notGivenParams };
      delete newNotGiven[key as string];
      setNotGivenParams(newNotGiven);
    }

    const newParams = {
      ...localParams,
      [key]: value,
    };

    if (cycleType === "Brayton") {
      if (pressureInputMode === "ratio") {
        if (key === "pressure_ratio") {
          if (newParams.p_1) {
            newParams.p_2 = newParams.p_1 * value;
            newParams.p_3 = newParams.p_2;
          } else if (newParams.p_2) {
            newParams.p_1 = newParams.p_2 / value;
          }
        } else if (key === "p_1" && newParams.pressure_ratio) {
          newParams.p_2 = value * newParams.pressure_ratio;
          newParams.p_3 = newParams.p_2;
        } else if (key === "p_2" && newParams.pressure_ratio) {
          newParams.p_1 = newParams.p_2 / newParams.pressure_ratio;
          newParams.p_3 = newParams.p_2;
        }
      } else if (pressureInputMode === "direct") {
        if (key === "p_2") {
          newParams.p_3 = value;
          if (newParams.p_1) {
            newParams.pressure_ratio = value / newParams.p_1;
          }
        } else if (key === "p_1" && newParams.p_2) {
          newParams.pressure_ratio = newParams.p_2 / value;
        }
      }
    }

    if (key === "T_1") {
      newParams.T_low = value;
    } else if (key === "T_3") {
      newParams.T_high = value;
    } else if (key === "p_1") {
      newParams.p_low = value;
    } else if (key === "p_2" || key === "p_3") {
      newParams.p_high = value;
    }

    setLocalParams(newParams);
    onParamChange(newParams);
  };

  const handleDirectInput = (key: keyof CycleParams, value: string) => {
    if (value === "" || value === null || value === undefined) {
      const newParams = { ...localParams };
      delete newParams[key];

      setLocalParams(newParams);
      onParamChange(newParams);
      return;
    }

    // Save raw string to allow incomplete decimals like "0."
    setLocalParams((prev) => ({
      ...prev,
      [key]: value,
    }));

    // Only update parent when it's a valid number
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onParamChange({ [key]: numValue });
    }
  };

  const markAsNotGiven = (key: keyof CycleParams) => {
    const newNotGiven = { ...notGivenParams };
    newNotGiven[key as string] = true;
    setNotGivenParams(newNotGiven);

    const newParams = { ...localParams };
    delete newParams[key];

    setLocalParams(newParams);
    onParamChange(newParams);
  };

  const parameters = getParameters(cycleType);

  const getAdvancedParameters = (): ParameterConfig[] => {
    if (cycleType === "Brayton" && showAdvancedParams) {
      return advancedBraytonParameters;
    }
    return [];
  };

  const advancedParameters = getAdvancedParameters();

  const handlePressureModeChange = (value: "ratio" | "direct") => {
    setPressureInputMode(value);
    form.setValue("pressureMode", value);

    if (
      value === "ratio" &&
      localParams.p_2 &&
      localParams.pressure_ratio &&
      !localParams.p_1
    ) {
      const calculatedP1 = localParams.p_2 / localParams.pressure_ratio;
      handleParamChange("p_1", calculatedP1);
    }
  };

  const loadPredefinedExample = () => {
    const exampleParams: Partial<CycleParams> = {
      T_1: 300,
      T_3: 1000,
      p_1: 100,
      p_2: 2000,
      p_3: 2000,
      pressure_ratio: 20,
      cp: 1.005,
      gamma: 1.4,
      eta_compressor: 1.0,
      eta_turbine: 1.0,
    };

    setLocalParams({ ...localParams, ...exampleParams });
    onParamChange(exampleParams);
    setPredefinedExample(true);
    toast.success("Loaded predefined Brayton cycle example");
  };

  return (
    <Card className="h-full overflow-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">
            Cycle Parameters
          </CardTitle>
          {cycleType === "Brayton" && (
            <Button
              variant="outline"
              size="sm"
              onClick={loadPredefinedExample}
              className={predefinedExample ? "bg-green-100" : ""}
            >
              Load Example Problem
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {cycleType === "Brayton" && (
            <div className="mb-4">
              <Form {...form}>
                <FormField
                  control={form.control}
                  name="pressureMode"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Pressure Input Method</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) =>
                            handlePressureModeChange(
                              value as "ratio" | "direct",
                            )
                          }
                          defaultValue={pressureInputMode}
                          className="flex flex-row space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="ratio" id="ratio" />
                            <Label htmlFor="ratio">Pressure Ratio</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="direct" id="direct" />
                            <Label htmlFor="direct">Direct Pressures</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </Form>
              <Separator className="my-4" />
            </div>
          )}

          {parameters.map((param) => (
            <div key={param.key} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={param.key as string}
                    className="flex items-center gap-2"
                  >
                    {param.label}
                    {param.required && (
                      <Badge variant="outline" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{param.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-2">
                  {notGivenParams[param.key as string] ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="h-9 px-4">
                        Not Given
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newNotGiven = { ...notGivenParams };
                          delete newNotGiven[param.key as string];
                          setNotGivenParams(newNotGiven);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Input
                        id={param.key as string}
                        type="text"
                        className="w-24 text-right"
                        value={localParams[param.key] ?? ""}
                        placeholder={param.format(param.defaultValue)}
                        onChange={(e) =>
                          handleDirectInput(param.key, e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            handleDirectInput(param.key, "");
                          }
                        }}
                      />
                      <span className="text-xs text-gray-500 w-8">
                        {param.unit}
                      </span>
                      {!param.required && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => markAsNotGiven(param.key)}
                        >
                          Not Given
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {parameters.indexOf(param) < parameters.length - 1 && (
                <Separator className="my-2" />
              )}
            </div>
          ))}

          {cycleType === "Brayton" && (
            <>
              <Separator className="my-4" />
              <div className="flex items-center space-x-2">
                <Switch
                  checked={showAdvancedParams}
                  onCheckedChange={setShowAdvancedParams}
                  id="advanced-mode"
                />
                <Label htmlFor="advanced-mode">
                  Show Component Efficiencies
                </Label>
              </div>
            </>
          )}

          {advancedParameters.length > 0 && (
            <div className="mt-4 space-y-6">
              {advancedParameters.map((param) => (
                <div key={param.key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={param.key as string}>{param.label}</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{param.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex items-center gap-2">
                      {notGivenParams[param.key as string] ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="h-9 px-4">
                            Not Given
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newNotGiven = { ...notGivenParams };
                              delete newNotGiven[param.key as string];
                              setNotGivenParams(newNotGiven);
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Input
                            id={param.key as string}
                            type="text"
                            className="w-24 text-right"
                            value={localParams[param.key] ?? ""}
                            placeholder={param.format(param.defaultValue)}
                            onChange={(e) =>
                              handleDirectInput(param.key, e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Escape") {
                                handleDirectInput(param.key, "");
                              }
                            }}
                          />
                          <span className="text-xs text-gray-500 w-8">
                            {param.unit}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => markAsNotGiven(param.key)}
                          >
                            Not Given
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {advancedParameters.indexOf(param) <
                    advancedParameters.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ParameterControls;
