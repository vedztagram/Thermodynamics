import { CycleParams } from "@/lib/types";

interface CarnotAnimationProps {
  params: CycleParams;
  isAnimating: boolean;
}

const CarnotAnimation = ({ params, isAnimating }: CarnotAnimationProps) => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 600 250" className="max-w-full max-h-full">
        {/* Hot reservoir */}
        <rect
          x="150"
          y="30"
          width="300"
          height="50"
          rx="5"
          fill="#F24C3D"
          stroke="#333"
          strokeWidth="2"
        />
        <text x="300" y="60" textAnchor="middle" fill="white" fontWeight="bold">
          Hot Reservoir (T_H)
        </text>

        {/* Cold reservoir */}
        <rect
          x="150"
          y="170"
          width="300"
          height="50"
          rx="5"
          fill="#57C5B6"
          stroke="#333"
          strokeWidth="2"
        />
        <text
          x="300"
          y="200"
          textAnchor="middle"
          fill="white"
          fontWeight="bold"
        >
          Cold Reservoir (T_L)
        </text>

        {/* Carnot engine */}
        <rect
          x="250"
          y="100"
          width="100"
          height="50"
          rx="8"
          fill="#1A5F7A"
          stroke="#333"
          strokeWidth="2"
        />
        <text
          x="300"
          y="130"
          textAnchor="middle"
          fill="white"
          fontWeight="bold"
        >
          Carnot Engine
        </text>

        {/* Heat flow arrows - Hot to Engine */}
        <path
          d="M300,80 L300,100"
          stroke="#F24C3D"
          strokeWidth="4"
          markerEnd="url(#arrowhead)"
        />
        <g className={isAnimating ? "animate-flow" : ""}>
          <circle cx="300" cy="90" r="3" fill="#F24C3D" />
          <circle cx="300" cy="85" r="3" fill="#F24C3D" />
          <circle cx="300" cy="95" r="3" fill="#F24C3D" />
        </g>

        {/* Heat flow arrows - Engine to Cold */}
        <path
          d="M300,150 L300,170"
          stroke="#57C5B6"
          strokeWidth="4"
          markerEnd="url(#arrowhead)"
        />
        <g className={isAnimating ? "animate-flow" : ""}>
          <circle cx="300" cy="160" r="3" fill="#57C5B6" />
          <circle cx="300" cy="155" r="3" fill="#57C5B6" />
          <circle cx="300" cy="165" r="3" fill="#57C5B6" />
        </g>

        {/* Work output */}
        <path
          d="M350,125 L400,125"
          stroke="#159895"
          strokeWidth="4"
          markerEnd="url(#arrowhead)"
        />
        <g className={isAnimating ? "animate-flow" : ""}>
          <circle cx="375" cy="125" r="3" fill="#159895" />
          <circle cx="365" cy="125" r="3" fill="#159895" />
          <circle cx="385" cy="125" r="3" fill="#159895" />
        </g>
        <text
          x="375"
          y="115"
          textAnchor="middle"
          fill="#159895"
          fontWeight="bold"
        >
          Work Output
        </text>

        {/* State points */}
        <circle
          cx="250"
          y="100"
          r="7"
          fill="white"
          stroke="#333"
          strokeWidth="1.5"
        />
        <text x="240" y="90" textAnchor="middle" fill="#333" fontWeight="bold">
          1
        </text>

        <circle
          cx="250"
          y="150"
          r="7"
          fill="white"
          stroke="#333"
          strokeWidth="1.5"
        />
        <text x="240" y="160" textAnchor="middle" fill="#333" fontWeight="bold">
          4
        </text>

        <circle
          cx="350"
          y="100"
          r="7"
          fill="white"
          stroke="#333"
          strokeWidth="1.5"
        />
        <text x="360" y="90" textAnchor="middle" fill="#333" fontWeight="bold">
          2
        </text>

        <circle
          cx="350"
          y="150"
          r="7"
          fill="white"
          stroke="#333"
          strokeWidth="1.5"
        />
        <text x="360" y="160" textAnchor="middle" fill="#333" fontWeight="bold">
          3
        </text>

        {/* Arrow definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
          </marker>
        </defs>
      </svg>
    </div>
  );
};

export default CarnotAnimation;
