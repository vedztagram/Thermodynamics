import { useState } from "react";
import { CycleType, CycleParams } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowRight,
  ThermometerIcon,
  GaugeIcon,
  Percent,
  RotateCw,
} from "lucide-react";

interface ComponentParametersProps {
  cycleType: CycleType;
  cycleParams: CycleParams;
  onParamChange?: (params: Partial<CycleParams>) => void;
  isAnimating?: boolean;
}

const ComponentParameters = ({
  cycleType,
  cycleParams,
  onParamChange,
  isAnimating,
}: ComponentParametersProps) => {
  const [activeTab, setActiveTab] = useState("compressor");

  // Select which components to show based on cycle type
  const getAvailableComponents = () => {
    switch (cycleType) {
      case "Otto":
        return ["cylinder", "piston", "combustion"];
      case "Diesel":
        return ["cylinder", "piston", "combustion", "injector"];
      case "Brayton":
        return ["compressor", "combustor", "turbine"];
      default:
        return ["compressor", "turbine"];
    }
  };

  const components = getAvailableComponents();

  // Get component-specific parameters
  const getComponentParameters = (component: string) => {
    switch (component) {
      case "compressor":
        return [
          {
            name: "Inlet Pressure",
            value: cycleParams.p_1,
            unit: "kPa",
            icon: <GaugeIcon className="h-4 w-4" />,
          },
          {
            name: "Outlet Pressure",
            value: cycleParams.p_2,
            unit: "kPa",
            icon: <GaugeIcon className="h-4 w-4" />,
          },
          {
            name: "Pressure Ratio",
            value: (
              cycleParams.pressure_ratio ||
              (cycleParams.p_2 || 0) / (cycleParams.p_1 || 1)
            ).toFixed(2),
            unit: "",
            icon: <ArrowRight className="h-4 w-4" />,
          },
          {
            name: "Isentropic Efficiency",
            value: ((cycleParams.eta_compressor || 0.85) * 100).toFixed(1),
            unit: "%",
            icon: <Percent className="h-4 w-4" />,
          },
          {
            name: "Inlet Temperature",
            value: cycleParams.T_1,
            unit: "K",
            icon: <ThermometerIcon className="h-4 w-4" />,
          },
        ];
      case "turbine":
        return [
          {
            name: "Inlet Pressure",
            value: cycleParams.p_3,
            unit: "kPa",
            icon: <GaugeIcon className="h-4 w-4" />,
          },
          {
            name: "Outlet Pressure",
            value: cycleParams.p_4,
            unit: "kPa",
            icon: <GaugeIcon className="h-4 w-4" />,
          },
          {
            name: "Pressure Ratio",
            value: (
              cycleParams.pressure_ratio ||
              (cycleParams.p_3 || 0) / (cycleParams.p_4 || 1)
            ).toFixed(2),
            unit: "",
            icon: <ArrowRight className="h-4 w-4" />,
          },
          {
            name: "Isentropic Efficiency",
            value: ((cycleParams.eta_turbine || 0.87) * 100).toFixed(1),
            unit: "%",
            icon: <Percent className="h-4 w-4" />,
          },
          {
            name: "Inlet Temperature",
            value: cycleParams.T_3,
            unit: "K",
            icon: <ThermometerIcon className="h-4 w-4" />,
          },
          {
            name: "Rotation Speed",
            value: "3600",
            unit: "RPM",
            icon: <RotateCw className="h-4 w-4" />,
          },
        ];
      case "pump":
        return [
          {
            name: "Inlet Pressure",
            value: cycleParams.p_1,
            unit: "kPa",
            icon: <GaugeIcon className="h-4 w-4" />,
          },
          {
            name: "Outlet Pressure",
            value: cycleParams.p_2,
            unit: "kPa",
            icon: <GaugeIcon className="h-4 w-4" />,
          },
          {
            name: "Pressure Rise",
            value: ((cycleParams.p_2 || 0) - (cycleParams.p_1 || 0)).toFixed(0),
            unit: "kPa",
            icon: <ArrowRight className="h-4 w-4" />,
          },
          {
            name: "Isentropic Efficiency",
            value: "80.0",
            unit: "%",
            icon: <Percent className="h-4 w-4" />,
          },
          {
            name: "Inlet Temperature",
            value: cycleParams.T_1,
            unit: "K",
            icon: <ThermometerIcon className="h-4 w-4" />,
          },
        ];
      case "boiler":
      case "heater":
      case "combustor":
        return [
          {
            name: "Inlet Pressure",
            value: cycleParams.p_2,
            unit: "kPa",
            icon: <GaugeIcon className="h-4 w-4" />,
          },
          {
            name: "Heat Addition",
            value: "Constant Pressure",
            unit: "",
            icon: <ArrowRight className="h-4 w-4" />,
          },
          {
            name: "Inlet Temperature",
            value: cycleParams.T_2,
            unit: "K",
            icon: <ThermometerIcon className="h-4 w-4" />,
          },
          {
            name: "Outlet Temperature",
            value: cycleParams.T_3,
            unit: "K",
            icon: <ThermometerIcon className="h-4 w-4" />,
          },
        ];
      case "condenser":
      case "cooler":
        return [
          {
            name: "Inlet Pressure",
            value: cycleParams.p_4,
            unit: "kPa",
            icon: <GaugeIcon className="h-4 w-4" />,
          },
          {
            name: "Heat Rejection",
            value: "Constant Pressure",
            unit: "",
            icon: <ArrowRight className="h-4 w-4" />,
          },
          {
            name: "Condensing Temperature",
            value: cycleParams.T_4,
            unit: "K",
            icon: <ThermometerIcon className="h-4 w-4" />,
          },
        ];
      case "cylinder":
      case "piston":
        return [
          {
            name: "Compression Ratio",
            value: cycleParams.compression_ratio?.toFixed(1) || "8.0",
            unit: "",
            icon: <ArrowRight className="h-4 w-4" />,
          },
          {
            name: "Maximum Pressure",
            value: cycleParams.p_3,
            unit: "kPa",
            icon: <GaugeIcon className="h-4 w-4" />,
          },
          {
            name: "Maximum Temperature",
            value: cycleParams.T_3,
            unit: "K",
            icon: <ThermometerIcon className="h-4 w-4" />,
          },
        ];
      case "combustion":
        return [
          {
            name: "Heat Addition",
            value:
              cycleType === "Otto" ? "Constant Volume" : "Constant Pressure",
            unit: "",
            icon: <ArrowRight className="h-4 w-4" />,
          },
          {
            name: "Maximum Temperature",
            value: cycleParams.T_3,
            unit: "K",
            icon: <ThermometerIcon className="h-4 w-4" />,
          },
        ];
      case "injector":
        return [
          {
            name: "Cutoff Ratio",
            value: cycleParams.cutoff_ratio?.toFixed(1) || "2.0",
            unit: "",
            icon: <ArrowRight className="h-4 w-4" />,
          },
          {
            name: "Injection Pressure",
            value: cycleParams.p_2,
            unit: "kPa",
            icon: <GaugeIcon className="h-4 w-4" />,
          },
        ];
      default:
        return [];
    }
  };

  // Get user-friendly component name
  const getComponentDisplayName = (component: string) => {
    const names: Record<string, string> = {
      compressor: "Compressor",
      turbine: "Turbine",
      pump: "Pump",
      boiler: "Boiler",
      heater: "Heat Source",
      cooler: "Heat Sink",
      condenser: "Condenser",
      cylinder: "Cylinder",
      piston: "Piston",
      combustion: "Combustion Chamber",
      combustor: "Combustor",
      injector: "Fuel Injector",
    };

    return (
      names[component] || component.charAt(0).toUpperCase() + component.slice(1)
    );
  };

  // Get component description
  const getComponentDescription = (component: string) => {
    const descriptions: Record<string, string> = {
      compressor:
        "Increases the pressure of the working fluid through mechanical work input.",
      turbine:
        "Extracts energy from high-pressure, high-temperature fluid to produce mechanical work.",
      pump: "Increases the pressure of liquid working fluid through mechanical work input.",
      boiler:
        "Adds heat to the working fluid at constant pressure, often changing phase from liquid to vapor.",
      heater: "Adds heat to the working fluid at high temperature.",
      cooler: "Rejects heat from the working fluid at low temperature.",
      condenser:
        "Rejects heat from the working fluid, often changing phase from vapor to liquid.",
      cylinder:
        "Contains the working fluid and allows volume changes during the cycle.",
      piston:
        "Provides the moving boundary that changes the volume of the working fluid.",
      combustion:
        "Where fuel combustion occurs, adding heat to the working fluid.",
      combustor:
        "Chamber where fuel is burned with compressed air to increase temperature.",
      injector:
        "Delivers fuel to the combustion chamber at precise timing and quantity.",
    };

    return descriptions[component] || "";
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Component Parameters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            {components.slice(0, 4).map((component) => (
              <TabsTrigger key={component} value={component}>
                {getComponentDisplayName(component)}
              </TabsTrigger>
            ))}
          </TabsList>

          {components.map((component) => (
            <TabsContent
              key={component}
              value={component}
              className="space-y-4"
            >
              <div>
                <Badge variant="outline" className="mb-2">
                  {getComponentDisplayName(component)}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {getComponentDescription(component)}
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parameter</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getComponentParameters(component).map((param, index) => (
                    <TableRow key={index}>
                      <TableCell className="flex items-center gap-2">
                        {param.icon}
                        <span>{param.name}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {param.value} {param.unit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ComponentParameters;
