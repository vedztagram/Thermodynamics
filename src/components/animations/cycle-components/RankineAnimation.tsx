import { useState, useEffect, useRef } from "react";
import { CycleParams } from "@/lib/types";

interface RankineAnimationProps {
  params: CycleParams;
  isAnimating: boolean;
}

const RankineAnimation = ({ params, isAnimating }: RankineAnimationProps) => {
  const [bubbles, setBubbles] = useState<
    { x: number; y: number; r: number; speed: number; opacity: number }[]
  >([]);
  const [flameIntensity, setFlameIntensity] = useState(0.7);
  const [waterFlowRate, setWaterFlowRate] = useState(0);
  const [steamFlowRate, setSteamFlowRate] = useState(0);
  const [pressureGauge, setPressureGauge] = useState(0);
  const [temperatureGauge, setTemperatureGauge] = useState(0);

  const svgRef = useRef<SVGSVGElement>(null);

  // Create boiler bubbles and animate system
  useEffect(() => {
    if (!isAnimating) {
      setBubbles([]);
      return;
    }

    // Initialize animation parameters based on cycle parameters
    setPressureGauge(params.p_high / 100);
    setTemperatureGauge((params.T_high - 273) / 5);
    setWaterFlowRate(
      params.power_output ? (params.power_output / 100) * 0.8 : 0.8,
    );
    setSteamFlowRate(params.power_output ? params.power_output / 100 : 1);

    // Create initial bubbles
    const initialBubbles = Array.from({ length: 8 }, () => ({
      x: 160 + Math.random() * 60,
      y: 130 + Math.random() * 30,
      r: 2 + Math.random() * 3,
      speed: 0.5 + Math.random() * 0.5,
      opacity: 0.5 + Math.random() * 0.5,
    }));

    setBubbles(initialBubbles);

    // Create new bubbles periodically
    const bubbleInterval = setInterval(() => {
      setBubbles((prev) => {
        // Move existing bubbles up
        const movedBubbles = prev
          .map((bubble) => ({
            ...bubble,
            y: bubble.y - bubble.speed,
            opacity: bubble.y < 70 ? bubble.opacity * 0.95 : bubble.opacity,
          }))
          .filter((bubble) => bubble.y > 30 && bubble.opacity > 0.1); // Remove bubbles that reach the top

        // Add a new bubble if current bubble count is low
        if (movedBubbles.length < 12) {
          movedBubbles.push({
            x: 160 + Math.random() * 60,
            y: 130 + Math.random() * 30,
            r: 2 + Math.random() * 3,
            speed: 0.5 + Math.random() * 0.5,
            opacity: 0.5 + Math.random() * 0.5,
          });
        }

        return movedBubbles;
      });
    }, 200);

    // Animate flame intensity
    const flameInterval = setInterval(() => {
      setFlameIntensity((prev) => 0.7 + Math.random() * 0.3);
    }, 120);

    // Animate pressure and temperature gauges
    const gaugeInterval = setInterval(() => {
      setPressureGauge((prev) => prev + (Math.random() * 0.2 - 0.1));
      setTemperatureGauge((prev) => prev + (Math.random() * 0.2 - 0.1));
    }, 500);

    return () => {
      clearInterval(bubbleInterval);
      clearInterval(flameInterval);
      clearInterval(gaugeInterval);
    };
  }, [isAnimating, params]);

  // Map temperature to color gradient
  const getHeatColor = (temp: number) => {
    const normalizedTemp =
      (temp - params.T_low) / (params.T_high - params.T_low);
    const r = Math.min(255, Math.round(normalizedTemp * 255));
    const g = Math.min(100, Math.round(normalizedTemp * 50));
    const b = Math.min(255, Math.round((1 - normalizedTemp) * 255));
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Use parameters to affect animation
  const turbineRotationSpeed = isAnimating
    ? (params.eta_turbine || 0.85) * 2
    : 0;
  const pumpRotationSpeed = isAnimating ? (params.eta_pump || 0.8) * 2 : 0;
  const condenserFlow = isAnimating ? params.p_low / 10 : 0;

  // Calculate superheater parameters
  const superheaterTemp =
    params.T_high + (params.superheater_temp_increase || 50);

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <svg
        viewBox="0 0 700 400"
        className="max-w-full max-h-full shadow-lg"
        ref={svgRef}
      >
        {/* Engineering grid background */}
        <defs>
          <pattern
            id="smallGrid"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 10 0 L 0 0 0 10"
              fill="none"
              stroke="rgba(150,150,150,0.1)"
              strokeWidth="0.5"
            />
          </pattern>
          <pattern
            id="grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <rect width="50" height="50" fill="url(#smallGrid)" />
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="rgba(150,150,150,0.2)"
              strokeWidth="1"
            />
          </pattern>

          {/* Gradient for heat effects */}
          <linearGradient id="flameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="yellow" />
            <stop offset="50%" stopColor="orange" />
            <stop offset="100%" stopColor="red" />
          </linearGradient>

          {/* Animation for flowing steam */}
          <linearGradient id="steamFlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.3">
              <animate
                attributeName="offset"
                values="0;1"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor="#fff" stopOpacity="0.1">
              <animate
                attributeName="offset"
                values="0.5;1.5"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#fff" stopOpacity="0.3">
              <animate
                attributeName="offset"
                values="1;2"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>

          {/* Filter for glow effects */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background */}
        <rect width="700" height="400" fill="url(#grid)" />

        {/* Title area with system parameters */}
        <rect
          x="10"
          y="10"
          width="680"
          height="40"
          rx="5"
          fill="rgba(26, 95, 122, 0.1)"
          stroke="#1A5F7A"
          strokeWidth="1"
        />
        <text
          x="350"
          y="35"
          textAnchor="middle"
          fontSize="18"
          fontWeight="bold"
          fill="#1A5F7A"
        >
          Rankine Cycle Simulation
        </text>

        {/* System parameters display */}
        <g transform="translate(500, 30)">
          <text x="0" y="0" textAnchor="start" fontSize="10" fill="#333">
            Power: {params.power_output} kW | η:{" "}
            {((params.eta_turbine || 0.85) * 100).toFixed(0)}% | P:{" "}
            {params.p_high}/{params.p_low} kPa | T: {params.T_high}/
            {params.T_low} K
          </text>
        </g>

        {/* 1. BOILER with advanced technical design */}
        <g>
          <rect
            x="140"
            y="60"
            width="120"
            height="180"
            rx="2"
            fill="#e5e5e5"
            stroke="#444"
            strokeWidth="2"
          />

          {/* Boiler internals - heat exchanger tubes */}
          <g>
            {Array.from({ length: 9 }).map((_, i) => (
              <line
                key={`boiler-tube-${i}`}
                x1="150"
                y1={80 + i * 16}
                x2="250"
                y2={80 + i * 16}
                stroke="#777"
                strokeWidth="6"
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* Boiler water */}
          <rect
            x="150"
            y="120"
            width="100"
            height="110"
            rx="0"
            fill="#57C5B6"
            opacity="0.7"
          />

          {/* Heat distribution in boiler */}
          <rect
            x="150"
            y="100"
            width="100"
            height="20"
            rx="0"
            fill={getHeatColor(params.T_high - 50)}
            opacity="0.6"
          />
          <rect
            x="150"
            y="80"
            width="100"
            height="20"
            rx="0"
            fill={getHeatColor(params.T_high)}
            opacity="0.6"
          />

          {/* Steam space with bubbles */}
          <g>
            {bubbles.map((bubble, i) => (
              <circle
                key={i}
                cx={bubble.x}
                cy={bubble.y}
                r={bubble.r}
                fill="white"
                opacity={bubble.opacity}
              />
            ))}
          </g>

          {/* Combustion chamber */}
          <rect
            x="140"
            y="240"
            width="120"
            height="60"
            rx="2"
            fill="#d5d5d5"
            stroke="#444"
            strokeWidth="2"
          />

          {/* Flames with animation */}
          <g
            style={{ opacity: flameIntensity }}
            className={isAnimating ? "animate-pulse" : ""}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <path
                key={`flame-${i}`}
                d={`M${160 + i * 15},300 Q${160 + i * 15},280 ${165 + i * 15},270 Q${170 + i * 15},280 ${170 + i * 15},300`}
                fill="url(#flameGradient)"
                opacity={0.7 + Math.sin(i) * 0.3}
                filter="url(#glow)"
              />
            ))}
          </g>

          {/* Boiler labels and gauges */}
          <text
            x="200"
            y="55"
            textAnchor="middle"
            fill="#333"
            fontSize="16"
            fontWeight="bold"
          >
            Boiler
          </text>

          {/* Pressure gauge */}
          <g transform="translate(115, 100)">
            <circle
              cx="0"
              cy="0"
              r="15"
              fill="white"
              stroke="#333"
              strokeWidth="1"
            />
            <circle
              cx="0"
              cy="0"
              r="12"
              fill="#f8f8f8"
              stroke="#ddd"
              strokeWidth="0.5"
            />
            {Array.from({ length: 8 }).map((_, i) => (
              <line
                key={`pressure-tick-${i}`}
                x1="0"
                y1="-10"
                x2="0"
                y2="-12"
                stroke="#333"
                strokeWidth="0.5"
                transform={`rotate(${i * 45})`}
              />
            ))}
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-8"
              stroke="red"
              strokeWidth="0.5"
              transform={`rotate(${pressureGauge})`}
            />
            <text x="0" y="4" textAnchor="middle" fontSize="6" fill="#333">
              MPa
            </text>
          </g>

          {/* Temperature gauge */}
          <g transform="translate(115, 140)">
            <circle
              cx="0"
              cy="0"
              r="15"
              fill="white"
              stroke="#333"
              strokeWidth="1"
            />
            <circle
              cx="0"
              cy="0"
              r="12"
              fill="#f8f8f8"
              stroke="#ddd"
              strokeWidth="0.5"
            />
            {Array.from({ length: 8 }).map((_, i) => (
              <line
                key={`temp-tick-${i}`}
                x1="0"
                y1="-10"
                x2="0"
                y2="-12"
                stroke="#333"
                strokeWidth="0.5"
                transform={`rotate(${i * 45})`}
              />
            ))}
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-8"
              stroke="red"
              strokeWidth="0.5"
              transform={`rotate(${temperatureGauge})`}
            />
            <text x="0" y="4" textAnchor="middle" fontSize="6" fill="#333">
              °C
            </text>
          </g>

          {/* Parameter display */}
          <text x="200" y="250" textAnchor="middle" fill="#333" fontSize="10">
            p = {params.p_high.toFixed(0)} kPa | T = {params.T_high.toFixed(0)}{" "}
            K
          </text>
        </g>

        {/* 2. TURBINE with detailed engineering design */}
        <g>
          <circle
            cx="500"
            cy="100"
            r="40"
            fill="#e0e0e0"
            stroke="#444"
            strokeWidth="2"
          />
          <circle
            cx="500"
            cy="100"
            r="38"
            fill="none"
            stroke="#666"
            strokeWidth="0.5"
            strokeDasharray="3,1"
          />

          {/* Turbine housing with simulation-style details */}
          <path
            d="M 465,80 L 535,80 L 545,100 L 535,120 L 465,120 L 455,100 Z"
            fill="#d5d5d5"
            stroke="#444"
            strokeWidth="1"
          />

          {/* Turbine stages visualization */}
          <g transform="translate(500, 100)">
            <rect
              x="-10"
              y="-5"
              width="20"
              height="10"
              fill="#ddd"
              stroke="#555"
              strokeWidth="0.5"
            />
          </g>

          {/* Turbine blades */}
          <g
            style={{
              transform: `rotate(${isAnimating ? turbineRotationSpeed * 360 : 0}deg)`,
              transformOrigin: "500px 100px",
              transition: "transform 0.1s linear",
            }}
          >
            <path
              d="M 500,70 L 520,90 L 500,110 L 480,90 Z"
              fill="#57C5B6"
              stroke="#333"
            />
            <path
              d="M 470,100 L 490,80 L 510,100 L 490,120 Z"
              fill="#57C5B6"
              stroke="#333"
            />
            <path
              d="M 500,130 L 480,110 L 500,90 L 520,110 Z"
              fill="#57C5B6"
              stroke="#333"
            />
            <path
              d="M 530,100 L 510,120 L 490,100 L 510,80 Z"
              fill="#57C5B6"
              stroke="#333"
            />
            <circle
              cx="500"
              cy="100"
              r="10"
              fill="#d5d5d5"
              stroke="#444"
              strokeWidth="1"
            />
          </g>

          {/* Load connection */}
          <rect
            x="540"
            y="95"
            width="30"
            height="10"
            fill="#999"
            stroke="#555"
            strokeWidth="1"
          />
          <text x="555" y="90" textAnchor="middle" fontSize="8" fill="#333">
            Load
          </text>

          {/* Turbine labels */}
          <text
            x="500"
            y="55"
            textAnchor="middle"
            fill="#333"
            fontSize="16"
            fontWeight="bold"
          >
            Turbine
          </text>
          <text x="500" y="150" textAnchor="middle" fill="#333" fontSize="10">
            η = {((params.eta_turbine || 0.85) * 100).toFixed(0)}% | Power:{" "}
            {params.power_output} kW
          </text>
        </g>

        {/* 3. CONDENSER with enhanced engineering detail */}
        <g>
          <rect
            x="430"
            y="220"
            width="140"
            height="80"
            rx="2"
            fill="#e5e5e5"
            stroke="#444"
            strokeWidth="2"
          />

          {/* Condenser tubes - more detailed */}
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={`condenser-tube-${i}`}
              x1="440"
              y1={230 + i * 8}
              x2="560"
              y2={230 + i * 8}
              stroke="#57C5B6"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ))}

          {/* Condensate collection */}
          <rect
            x="440"
            y="290"
            width="120"
            height="10"
            fill="#57C5B6"
            opacity="0.6"
          />

          {/* Cooling water flow visualization */}
          <path
            d="M 430,245 L 410,245 L 410,265 L 430,265"
            fill="none"
            stroke="#57C5B6"
            strokeWidth="2"
          />
          <path
            d="M 570,265 L 590,265 L 590,245 L 570,245"
            fill="none"
            stroke="#57C5B6"
            strokeWidth="2"
          />

          {/* Animated cooling water */}
          {isAnimating &&
            Array.from({ length: 3 }).map((_, i) => (
              <g key={`cooling-water-${i}`}>
                <circle
                  cx={410 + ((i * 10) % 20)}
                  cy="255"
                  r="2"
                  fill="#57C5B6"
                >
                  <animate
                    attributeName="cx"
                    from="410"
                    to="430"
                    dur={`${2 + i * 0.2}s`}
                    repeatCount="indefinite"
                    begin={`${i * 0.2}s`}
                  />
                </circle>
                <circle
                  cx={570 + ((i * 10) % 20)}
                  cy="255"
                  r="2"
                  fill="#57C5B6"
                >
                  <animate
                    attributeName="cx"
                    from="570"
                    to="590"
                    dur={`${2 + i * 0.2}s`}
                    repeatCount="indefinite"
                    begin={`${i * 0.2}s`}
                  />
                </circle>
              </g>
            ))}

          {/* Condenser labels */}
          <text
            x="500"
            y="210"
            textAnchor="middle"
            fill="#333"
            fontSize="16"
            fontWeight="bold"
          >
            Condenser
          </text>
          <text x="500" y="310" textAnchor="middle" fill="#333" fontSize="10">
            p = {params.p_low.toFixed(2)} kPa | T = {params.T_low.toFixed(0)} K
          </text>

          {/* Cooling water labels */}
          <text x="400" y="240" textAnchor="end" fontSize="8" fill="#333">
            Cooling
          </text>
          <text x="400" y="250" textAnchor="end" fontSize="8" fill="#333">
            Water In
          </text>
          <text x="600" y="240" textAnchor="start" fontSize="8" fill="#333">
            Cooling
          </text>
          <text x="600" y="250" textAnchor="start" fontSize="8" fill="#333">
            Water Out
          </text>
        </g>

        {/* 4. PUMP with detailed mechanical design */}
        <g>
          <rect
            x="180"
            y="320"
            width="80"
            height="60"
            rx="2"
            fill="#e5e5e5"
            stroke="#444"
            strokeWidth="2"
          />

          {/* Pump body */}
          <circle
            cx="220"
            cy="350"
            r="20"
            fill="#d5d5d5"
            stroke="#444"
            strokeWidth="1"
          />
          <circle
            cx="220"
            cy="350"
            r="18"
            fill="#f5f5f5"
            stroke="#888"
            strokeWidth="0.5"
          />
          <circle
            cx="220"
            cy="350"
            r="8"
            fill="#1A5F7A"
            stroke="#444"
            strokeWidth="0.5"
          />

          {/* Pump impeller */}
          <g
            style={{
              transform: `rotate(${isAnimating ? pumpRotationSpeed * 360 : 0}deg)`,
              transformOrigin: "220px 350px",
              transition: "transform 0.1s linear",
            }}
          >
            <path
              d="M 220,340 L 225,345 L 220,350 L 215,345 Z"
              fill="#1A5F7A"
            />
            <path
              d="M 210,350 L 215,345 L 220,350 L 215,355 Z"
              fill="#1A5F7A"
            />
            <path
              d="M 220,360 L 215,355 L 220,350 L 225,355 Z"
              fill="#1A5F7A"
            />
            <path
              d="M 230,350 L 225,355 L 220,350 L 225,345 Z"
              fill="#1A5F7A"
            />
          </g>

          {/* Pump mechanical details */}
          <rect x="245" y="340" width="5" height="20" fill="#999" />
          <circle
            cx="247.5"
            cy="350"
            r="7"
            fill="#bbb"
            stroke="#777"
            strokeWidth="0.5"
          />
          <circle cx="247.5" cy="350" r="2" fill="#777" />

          {/* Pump inlet/outlet */}
          <rect
            x="170"
            y="345"
            width="10"
            height="10"
            fill="#1A5F7A"
            stroke="#444"
            strokeWidth="0.5"
          />
          <rect
            x="260"
            y="345"
            width="10"
            height="10"
            fill="#1A5F7A"
            stroke="#444"
            strokeWidth="0.5"
          />

          {/* Pump labels */}
          <text
            x="220"
            y="315"
            textAnchor="middle"
            fill="#333"
            fontSize="16"
            fontWeight="bold"
          >
            Pump
          </text>
          <text x="220" y="385" textAnchor="middle" fill="#333" fontSize="10">
            η = {((params.eta_pump || 0.8) * 100).toFixed(0)}%
          </text>
        </g>

        {/* CONNECTING PIPES with arrows showing flow direction */}
        <g>
          {/* Steam line - Boiler to Turbine */}
          <path
            d="M 260,90 L 460,90"
            stroke="#FF9F29"
            strokeWidth="3"
            fill="none"
          />

          {/* Steam flow visualization */}
          {isAnimating && (
            <>
              <path d="M 380,90 L 390,85 L 400,90 L 390,95 Z" fill="#FF9F29">
                <animate
                  attributeName="transform"
                  attributeType="XML"
                  type="translate"
                  from="-120 0"
                  to="60 0"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </path>
            </>
          )}

          {/* Exhaust line - Turbine to Condenser */}
          <path
            d="M 500,140 L 500,220"
            stroke="#FF9F29"
            strokeWidth="3"
            fill="none"
          />

          {/* Exhaust flow visualization */}
          {isAnimating && (
            <>
              <path
                d="M 500,180 L 495,170 L 500,160 L 505,170 Z"
                fill="#FF9F29"
              >
                <animate
                  attributeName="transform"
                  attributeType="XML"
                  type="translate"
                  from="0 -40"
                  to="0 40"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </path>
            </>
          )}

          {/* Condensate line - Condenser to Pump */}
          <path
            d="M 430,300 L 270,300 L 270,350"
            stroke="#57C5B6"
            strokeWidth="3"
            fill="none"
          />

          {/* Condensate flow visualization */}
          {isAnimating && (
            <>
              <path
                d="M 350,300 L 360,295 L 370,300 L 360,305 Z"
                fill="#57C5B6"
              >
                <animate
                  attributeName="transform"
                  attributeType="XML"
                  type="translate"
                  from="80 0"
                  to="-160 0"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
              </path>
            </>
          )}

          {/* Water line - Pump to Boiler */}
          <path
            d="M 180,350 L 140,350 L 140,150"
            stroke="#57C5B6"
            strokeWidth="3"
            fill="none"
          />

          {/* Water flow visualization */}
          {isAnimating && (
            <>
              <path
                d="M 140,240 L 135,250 L 140,260 L 145,250 Z"
                fill="#57C5B6"
              >
                <animate
                  attributeName="transform"
                  attributeType="XML"
                  type="translate"
                  from="0 110"
                  to="0 -90"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </path>
            </>
          )}
        </g>

        {/* STATE POINTS with engineering notation */}
        <g>
          {/* Point 1 - Pump Inlet / Condenser Exit */}
          <circle
            cx="270"
            cy="300"
            r="7"
            fill="white"
            stroke="#333"
            strokeWidth="1.5"
          />
          <text
            x="270"
            cy="293"
            textAnchor="middle"
            fill="#333"
            fontWeight="bold"
          >
            1
          </text>

          {/* Point 2 - Pump Outlet / Boiler Inlet */}
          <circle
            cx="140"
            cy="200"
            r="7"
            fill="white"
            stroke="#333"
            strokeWidth="1.5"
          />
          <text
            x="140"
            cy="193"
            textAnchor="middle"
            fill="#333"
            fontWeight="bold"
          >
            2
          </text>

          {/* Point 3 - Boiler Outlet / Turbine Inlet */}
          <circle
            cx="350"
            cy="90"
            r="7"
            fill="white"
            stroke="#333"
            strokeWidth="1.5"
          />
          <text
            x="350"
            cy="83"
            textAnchor="middle"
            fill="#333"
            fontWeight="bold"
          >
            3
          </text>

          {/* Point 4 - Turbine Outlet / Condenser Inlet */}
          <circle
            cx="500"
            cy="180"
            r="7"
            fill="white"
            stroke="#333"
            strokeWidth="1.5"
          />
          <text
            x="500"
            cy="173"
            textAnchor="middle"
            fill="#333"
            fontWeight="bold"
          >
            4
          </text>
        </g>

        {/* STATE PARAMETERS at each point */}
        <g transform="translate(270, 320)">
          <rect
            x="-20"
            y="-10"
            width="40"
            height="20"
            rx="2"
            fill="white"
            stroke="#444"
            strokeWidth="1"
            opacity="0.8"
          />
          <text
            x="0"
            y="5"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
          >
            {params.p_low.toFixed(0)} kPa
          </text>
        </g>

        <g transform="translate(120, 200)">
          <rect
            x="-20"
            y="-10"
            width="40"
            height="20"
            rx="2"
            fill="white"
            stroke="#444"
            strokeWidth="1"
            opacity="0.8"
          />
          <text
            x="0"
            y="5"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
          >
            {params.p_high.toFixed(0)} kPa
          </text>
        </g>

        <g transform="translate(350, 70)">
          <rect
            x="-20"
            y="-10"
            width="40"
            height="20"
            rx="2"
            fill="white"
            stroke="#444"
            strokeWidth="1"
            opacity="0.8"
          />
          <text
            x="0"
            y="5"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
          >
            {params.T_high.toFixed(0)} K
          </text>
        </g>

        <g transform="translate(520, 180)">
          <rect
            x="-20"
            y="-10"
            width="40"
            height="20"
            rx="2"
            fill="white"
            stroke="#444"
            strokeWidth="1"
            opacity="0.8"
          />
          <text
            x="0"
            y="5"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
          >
            {params.T_low.toFixed(0)} K
          </text>
        </g>
      </svg>
    </div>
  );
};

export default RankineAnimation;
