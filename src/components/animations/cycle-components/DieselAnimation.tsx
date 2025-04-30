import { useState, useEffect } from "react";
import { CycleParams } from "@/lib/types";

interface DieselAnimationProps {
  params: CycleParams;
  isAnimating: boolean;
}

const DieselAnimation = ({ params, isAnimating }: DieselAnimationProps) => {
  const [position, setPosition] = useState(0);

  useEffect(() => {
    if (isAnimating) {
      const interval = setInterval(() => {
        setPosition((prev) => (prev + 1) % 4);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isAnimating]);

  // Map temperature to color gradient
  const getHeatColor = (temp: number) => {
    const T_low = params.T_1 || 300;
    const T_high = params.T_3 || 1800;
    const normalizedTemp = (temp - T_low) / (T_high - T_low);
    const r = Math.min(255, Math.round(normalizedTemp * 255));
    const b = Math.min(255, Math.round((1 - normalizedTemp) * 255));
    return `rgb(${r}, 0, ${b})`;
  };

  // Calculate piston position based on cycle phase
  const getPistonY = () => {
    const baseY = 150;
    const stroke = 60;

    switch (position) {
      case 0:
        return baseY + stroke; // BDC
      case 1:
        return baseY; // TDC compressed
      case 2:
        return baseY + 20; // Partially down during constant pressure combustion
      case 3:
        return baseY + stroke; // BDC after expansion
      default:
        return baseY + stroke;
    }
  };

  const getCylinderColor = () => {
    switch (position) {
      case 0:
        return "#87CEEB"; // Cold intake
      case 1:
        return "#AABBCC"; // Compressed
      case 2:
        return getHeatColor(params.T_3 || 1800); // Hot after combustion
      case 3:
        return "#CCBBAA"; // Expanded
      default:
        return "#87CEEB";
    }
  };

  const pistonY = getPistonY();
  const cylinderColor = getCylinderColor();

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 600 250" className="max-w-full max-h-full">
        {/* Engine Block */}
        <rect
          x="200"
          y="70"
          width="200"
          height="140"
          rx="10"
          fill="#e5e5e5"
          stroke="#333"
          strokeWidth="2"
        />

        {/* Cylinder */}
        <rect
          x="250"
          y="90"
          width="100"
          height="120"
          rx="5"
          fill="#d4d4d4"
          stroke="#333"
          strokeWidth="2"
        />
        <rect
          x="260"
          y="100"
          width="80"
          height={pistonY - 100}
          rx="3"
          fill={cylinderColor}
        />

        {/* Piston */}
        <rect
          x="250"
          y={pistonY}
          width="100"
          height="20"
          rx="3"
          fill="#1A5F7A"
          stroke="#333"
          strokeWidth="1"
        />

        {/* Connecting Rod */}
        <rect
          x="295"
          y={pistonY + 15}
          width="10"
          height="50"
          rx="2"
          fill="#999"
          stroke="#333"
          strokeWidth="1"
        />

        {/* Crankshaft */}
        <circle
          cx="300"
          cy={pistonY + 75}
          r="20"
          fill="#666"
          stroke="#333"
          strokeWidth="1"
          className={isAnimating ? "animate-spin" : ""}
        />
        <circle cx="300" cy={pistonY + 75} r="5" fill="#333" />

        {/* Valves */}
        <circle
          cx="270"
          cy="90"
          r="8"
          fill={position === 0 ? "#5cb85c" : "#d9534f"}
          stroke="#333"
          strokeWidth="1"
        />
        <circle
          cx="330"
          cy="90"
          r="8"
          fill={position === 3 ? "#5cb85c" : "#d9534f"}
          stroke="#333"
          strokeWidth="1"
        />

        {/* Fuel Injector */}
        <rect
          x="290"
          y="80"
          width="20"
          height="10"
          fill="#ccc"
          stroke="#333"
          strokeWidth="1"
        />
        {position === 1 && (
          <g className="animate-pulse">
            <path d="M295,90 L305,100" stroke="orange" strokeWidth="1" />
            <path d="M300,90 L300,105" stroke="orange" strokeWidth="1" />
            <path d="M305,90 L295,100" stroke="orange" strokeWidth="1" />
          </g>
        )}

        {/* State points */}
        <circle
          cx="250"
          cy="100"
          r="7"
          fill="white"
          stroke="#333"
          strokeWidth="1.5"
        />
        <text x="250" y="90" textAnchor="middle" fill="#333" fontWeight="bold">
          1
        </text>

        <circle
          cx="250"
          cy="210"
          r="7"
          fill="white"
          stroke="#333"
          strokeWidth="1.5"
        />
        <text x="250" y="225" textAnchor="middle" fill="#333" fontWeight="bold">
          2
        </text>

        <circle
          cx="350"
          cy="120"
          r="7"
          fill="white"
          stroke="#333"
          strokeWidth="1.5"
        />
        <text x="350" y="110" textAnchor="middle" fill="#333" fontWeight="bold">
          3
        </text>

        <circle
          cx="350"
          cy="210"
          r="7"
          fill="white"
          stroke="#333"
          strokeWidth="1.5"
        />
        <text x="350" y="225" textAnchor="middle" fill="#333" fontWeight="bold">
          4
        </text>

        {/* Title */}
        <text
          x="300"
          y="50"
          textAnchor="middle"
          fill="#333"
          fontWeight="bold"
          fontSize="16"
        >
          Diesel Cycle Engine
        </text>

        {/* Current phase */}
        <text
          x="300"
          y="240"
          textAnchor="middle"
          fill="#333"
          fontWeight="bold"
          fontSize="12"
        >
          {position === 0
            ? "Intake Stroke"
            : position === 1
              ? "Compression Stroke"
              : position === 2
                ? "Const. Pressure Combustion"
                : "Exhaust Stroke"}
        </text>
      </svg>
    </div>
  );
};

export default DieselAnimation;
