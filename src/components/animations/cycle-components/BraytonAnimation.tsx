import React, { useEffect, useRef, useState } from "react";
import { CycleParams } from "@/lib/types";
import { calculateCycleStatePoints } from "@/lib/thermodynamics";

// Temporary replacement until framer-motion is installed
const MotionG = ({ children, animate, transition, style }: any) => {
  // Create a simple transform style for rotation if animate.rotate is defined
  const transformStyle =
    animate?.rotate !== undefined
      ? { transform: `rotate(${animate.rotate}deg)` }
      : {};

  return <g style={{ ...transformStyle, ...style }}>{children}</g>;
};

const MotionCircle = ({
  children,
  animate,
  transition,
  style,
  ...props
}: any) => {
  return (
    <g>
      <circle {...props} />
      {children}
    </g>
  );
};

interface BraytonAnimationProps {
  params: CycleParams;
  isAnimating: boolean;
}

const BraytonAnimation: React.FC<BraytonAnimationProps> = ({
  params,
  isAnimating,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });
  const [animationProgress, setAnimationProgress] = useState(0);

  // Animation timing constants
  const TOTAL_DURATION = 10; // seconds for full cycle
  const SEGMENT_DURATIONS = {
    compression: 0.25, // 25% of total time
    combustion: 0.25, // 25% of total time
    expansion: 0.25, // 25% of total time
    exhaust: 0.25, // 25% of total time
  };

  // Calculate segment boundaries (0-1 scale)
  const SEGMENT_BOUNDARIES = {
    compression: SEGMENT_DURATIONS.compression,
    combustion: SEGMENT_DURATIONS.compression + SEGMENT_DURATIONS.combustion,
    expansion:
      SEGMENT_DURATIONS.compression +
      SEGMENT_DURATIONS.combustion +
      SEGMENT_DURATIONS.expansion,
    exhaust: 1.0, // Full cycle
  };

  // Update dimensions when the component mounts or window resizes
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const { width, height } = svgRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  // Animation loop
  useEffect(() => {
    let animationFrameId: number;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000; // Convert to seconds

      // Calculate progress (0 to 1) with looping
      const loopedTime = elapsed % TOTAL_DURATION;
      const progress = loopedTime / TOTAL_DURATION;

      setAnimationProgress(progress);

      if (isAnimating) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    if (isAnimating) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      // When paused, just keep the current frame
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isAnimating]);

  // Calculate current animation phase
  const getCurrentPhase = (progress: number) => {
    if (progress < SEGMENT_BOUNDARIES.compression) {
      return "compression";
    } else if (progress < SEGMENT_BOUNDARIES.combustion) {
      return "combustion";
    } else if (progress < SEGMENT_BOUNDARIES.expansion) {
      return "expansion";
    } else {
      return "exhaust";
    }
  };

  // Calculate phase-specific progress (0-1 within the current phase)
  const getPhaseProgress = (progress: number) => {
    const phase = getCurrentPhase(progress);

    switch (phase) {
      case "compression":
        return progress / SEGMENT_BOUNDARIES.compression;
      case "combustion":
        return (
          (progress - SEGMENT_BOUNDARIES.compression) /
          SEGMENT_DURATIONS.combustion
        );
      case "expansion":
        return (
          (progress - SEGMENT_BOUNDARIES.combustion) /
          SEGMENT_DURATIONS.expansion
        );
      case "exhaust":
        return (
          (progress - SEGMENT_BOUNDARIES.expansion) / SEGMENT_DURATIONS.exhaust
        );
      default:
        return 0;
    }
  };

  // Get cycle state points for visualization
  const cycleState = calculateCycleStatePoints("Brayton", params);
  const { points } = cycleState || { points: {} };

  // Extract parameters for animation
  const pressureRatio = params.pressure_ratio || 20; // Updated to match 2000/100 = 20
  const maxTemp = params.T_3 || 1000; // K - From the problem
  const minTemp = params.T_1 || 300; // K - From the problem

  // Current phase and progress
  const currentPhase = getCurrentPhase(animationProgress);
  const phaseProgress = getPhaseProgress(animationProgress);

  // Animation-specific calculations
  const compressorRotation =
    currentPhase === "compression"
      ? phaseProgress * 720 // Rotate twice during compression
      : currentPhase === "combustion" ||
          currentPhase === "expansion" ||
          currentPhase === "exhaust"
        ? 720 // Stay at max rotation after compression
        : 0;

  const turbineRotation =
    currentPhase === "expansion"
      ? phaseProgress * 720 // Rotate twice during expansion
      : currentPhase === "exhaust"
        ? 720 // Stay at max rotation after expansion
        : 0;

  // Flame animation
  const flameOpacity =
    currentPhase === "combustion"
      ? phaseProgress // Fade in during combustion
      : currentPhase === "expansion"
        ? 1 - phaseProgress // Fade out during expansion
        : currentPhase === "compression"
          ? 0 // Off during compression
          : 0; // Off during exhaust

  // Air flow animation
  const airFlowProgress = (() => {
    switch (currentPhase) {
      case "compression":
        return phaseProgress * 0.33; // First third of the flow path
      case "combustion":
        return 0.33 + phaseProgress * 0.33; // Second third
      case "expansion":
        return 0.66 + phaseProgress * 0.34; // Final third
      case "exhaust":
        return 1; // Complete
      default:
        return 0;
    }
  })();

  // Temperature color mapping
  const getTemperatureColor = (temp: number) => {
    // Map temperature from minTemp-maxTemp to blue-red
    const normalizedTemp = Math.max(
      0,
      Math.min(1, (temp - minTemp) / (maxTemp - minTemp)),
    );

    // Blue (cold) to red (hot)
    const r = Math.floor(normalizedTemp * 255);
    const g = Math.floor((1 - normalizedTemp) * 100);
    const b = Math.floor((1 - normalizedTemp) * 255);

    return `rgb(${r}, ${g}, ${b})`;
  };

  // Calculate current temperature at each stage based on animation progress
  const getCurrentTemperature = () => {
    // Using the values from the numerical problem
    const T1 = 300; // K (27°C)
    const T2 = 706.1; // K (as calculated in the problem)
    const T3 = 1000; // K (727°C)
    const T4 = 424.9; // K (as calculated in the problem)

    switch (currentPhase) {
      case "compression":
        return T1 + phaseProgress * (T2 - T1);
      case "combustion":
        return T2 + phaseProgress * (T3 - T2);
      case "expansion":
        return T3 - phaseProgress * (T3 - T4);
      case "exhaust":
        return T4 - phaseProgress * (T4 - T1);
      default:
        return T1;
    }
  };

  const currentTemp = getCurrentTemperature();
  const tempColor = getTemperatureColor(currentTemp);

  // SVG path for air flow
  const airFlowPath = "M50,150 C100,150 150,120 200,120 S300,150 350,150";

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="0 0 400 300"
        className="max-w-full max-h-full"
      >
        {/* Background */}
        <rect
          x="0"
          y="0"
          width="400"
          height="300"
          fill="#f8f9fa"
          rx="10"
          ry="10"
        />

        {/* Compressor */}
        <g transform={`translate(100, 150)`}>
          <circle
            cx="0"
            cy="0"
            r="40"
            fill="#e9ecef"
            stroke="#adb5bd"
            strokeWidth="2"
          />
          <MotionG
            animate={{ rotate: compressorRotation }}
            transition={{ duration: 0, ease: "linear" }}
          >
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <rect
                key={`compressor-blade-${angle}`}
                x="-5"
                y="-25"
                width="10"
                height="25"
                fill="#6c757d"
                transform={`rotate(${angle})`}
              />
            ))}
          </MotionG>
          <circle cx="0" cy="0" r="10" fill="#495057" />
          <text x="0" y="60" textAnchor="middle" fill="#212529" fontSize="12">
            Compressor
          </text>
        </g>

        {/* Combustion Chamber */}
        <g transform="translate(200, 120)">
          <rect
            x="-40"
            y="-30"
            width="80"
            height="60"
            rx="10"
            ry="10"
            fill="#e9ecef"
            stroke="#adb5bd"
            strokeWidth="2"
          />

          {/* Flame */}
          <MotionG style={{ opacity: flameOpacity }}>
            <path
              d="M-20,0 Q-10,-20 0,-5 Q10,-25 20,0 Q10,15 0,5 Q-10,20 -20,0"
              fill="orange"
            />
            <path
              d="M-15,0 Q-7,-15 0,-3 Q7,-18 15,0 Q7,10 0,3 Q-7,15 -15,0"
              fill="yellow"
            />
          </MotionG>

          <text x="0" y="50" textAnchor="middle" fill="#212529" fontSize="12">
            Combustor
          </text>
        </g>

        {/* Turbine */}
        <g transform={`translate(300, 150)`}>
          <circle
            cx="0"
            cy="0"
            r="40"
            fill="#e9ecef"
            stroke="#adb5bd"
            strokeWidth="2"
          />
          <MotionG
            animate={{ rotate: turbineRotation }}
            transition={{ duration: 0, ease: "linear" }}
          >
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <rect
                key={`turbine-blade-${angle}`}
                x="-5"
                y="-25"
                width="10"
                height="25"
                fill="#6c757d"
                transform={`rotate(${angle})`}
              />
            ))}
          </MotionG>
          <circle cx="0" cy="0" r="10" fill="#495057" />
          <text x="0" y="60" textAnchor="middle" fill="#212529" fontSize="12">
            Turbine
          </text>
        </g>

        {/* Air flow path */}
        <path d={airFlowPath} stroke="#adb5bd" strokeWidth="2" fill="none" />

        {/* Animated air particle */}
        <MotionCircle
          cx="0"
          cy="0"
          r="8"
          fill={tempColor}
          animate={{
            pathOffset: 1 - airFlowProgress,
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 0, ease: "linear" }}
          style={{ pathLength: 1, pathOffset: 1 }}
        >
          <animateMotion
            dur="10s"
            repeatCount="indefinite"
            path={airFlowPath}
            rotate="auto"
          />
        </MotionCircle>

        {/* Temperature indicator */}
        <g transform="translate(20, 20)">
          <rect
            x="0"
            y="0"
            width="80"
            height="20"
            rx="5"
            ry="5"
            fill="white"
            stroke="#adb5bd"
          />
          <rect
            x="5"
            y="5"
            width="70"
            height="10"
            rx="3"
            ry="3"
            fill="url(#temp-gradient)"
          />
          <circle
            cx={((currentTemp - minTemp) / (maxTemp - minTemp)) * 70 + 5}
            cy="10"
            r="8"
            fill={tempColor}
            stroke="white"
            strokeWidth="2"
          />
          <text x="40" y="35" textAnchor="middle" fill="#212529" fontSize="10">
            Temperature
          </text>
        </g>

        {/* Gradient for temperature scale */}
        <defs>
          <linearGradient id="temp-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="blue" />
            <stop offset="50%" stopColor="purple" />
            <stop offset="100%" stopColor="red" />
          </linearGradient>
        </defs>

        {/* Phase indicator */}
        <text
          x="200"
          y="280"
          textAnchor="middle"
          fill="#212529"
          fontSize="14"
          fontWeight="bold"
        >
          {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)}
        </text>

        {/* Temperatures and pressures from the numerical problem */}
        <g transform="translate(20, 60)">
          <text x="0" y="0" fill="#212529" fontSize="10">
            T₁ = 300 K (27°C), p₁ = 100 kPa
          </text>
          <text x="0" y="15" fill="#212529" fontSize="10">
            T₂ = 706.1 K, p₂ = 2000 kPa
          </text>
          <text x="0" y="30" fill="#212529" fontSize="10">
            T₃ = 1000 K (727°C), p₃ = 2000 kPa
          </text>
          <text x="0" y="45" fill="#212529" fontSize="10">
            T₄ = 424.9 K, p₄ = 100 kPa
          </text>
        </g>

        {/* Efficiency and work output */}
        <g transform="translate(180, 60)">
          <text x="0" y="0" fill="#212529" fontSize="10" fontWeight="bold">
            Net Work: 169.9 kJ/kg
          </text>
          <text x="0" y="15" fill="#212529" fontSize="10" fontWeight="bold">
            Efficiency: 57.5%
          </text>
        </g>
      </svg>
    </div>
  );
};

export default BraytonAnimation;
