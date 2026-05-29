interface MetanoiaLogoProps {
  className?: string;
}

/**
 * Brand wordmark — "Metanoia" inside a tilted orbit with two revolving stars.
 * Override sizing via className (e.g. className="h-10 w-auto").
 */
export function MetanoiaLogo({ className }: MetanoiaLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 680 360"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Metanoia"
    >
      <title>Metanoia</title>
      <desc>
        The Metanoia wordmark within a tilted elliptical orbit with two revolving stars.
      </desc>

      <g transform="rotate(-14 340 180)">
        <ellipse
          cx="340"
          cy="180"
          rx="315"
          ry="112"
          fill="none"
          stroke="#8a93d0"
          strokeWidth="1.2"
          opacity="0.55"
        />
      </g>

      <text
        x="340"
        y="208"
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="'Playfair Display', Georgia, serif"
        fontWeight={500}
        fontSize={88}
        letterSpacing="0.015em"
      >
        Metanoia
      </text>

      <g transform="rotate(-14 340 180)">
        <g>
          <path
            d="M 0 -17 L 1.6 -1.6 L 17 0 L 1.6 1.6 L 0 17 L -1.6 1.6 L -17 0 L -1.6 -1.6 Z"
            fill="#ffffff"
            opacity="0.92"
          />
          <circle r="7" fill="#ffffff" opacity="0.22" />
          <circle r="4" fill="#ffffff" />
          <animate
            attributeName="opacity"
            values="1;0.7;1"
            dur="3s"
            repeatCount="indefinite"
          />
          <animateMotion
            dur="14s"
            repeatCount="indefinite"
            path="M 655 180 A 315 112 0 1 1 25 180 A 315 112 0 1 1 655 180"
          />
        </g>
        <g>
          <path
            d="M 0 -17 L 1.6 -1.6 L 17 0 L 1.6 1.6 L 0 17 L -1.6 1.6 L -17 0 L -1.6 -1.6 Z"
            fill="#ffffff"
            opacity="0.92"
          />
          <circle r="7" fill="#ffffff" opacity="0.22" />
          <circle r="4" fill="#ffffff" />
          <animate
            attributeName="opacity"
            values="1;0.7;1"
            dur="3.5s"
            repeatCount="indefinite"
            begin="-1.5s"
          />
          <animateMotion
            dur="14s"
            repeatCount="indefinite"
            begin="-7s"
            path="M 655 180 A 315 112 0 1 1 25 180 A 315 112 0 1 1 655 180"
          />
        </g>
      </g>
    </svg>
  );
}
