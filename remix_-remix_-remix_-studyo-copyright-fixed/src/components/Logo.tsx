import React from 'react';
import { motion } from 'motion/react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  animate?: boolean;
}

export default function Logo({
  size = 120,
  className = '',
  showText = true,
  animate = true,
}: LogoProps) {
  // SVG size calculations
  const strokeW = 16;
  
  const pathTransition = animate ? {
    duration: 1.8,
    ease: "easeInOut" as const,
  } as const : undefined;

  const bodyTransition = animate ? {
    type: "spring" as const,
    stiffness: 80,
    damping: 15,
    delay: 0.6,
  } as const : undefined;

  const chatBubbleTransition = animate ? {
    type: "spring" as const,
    stiffness: 120,
    damping: 10,
    delay: 1.0,
  } as const : undefined;

  const soundwaveTransition = (index: number) => animate ? {
    duration: 0.8,
    repeat: Infinity,
    repeatType: "reverse" as const,
    ease: "easeInOut" as const,
    delay: index * 0.15,
  } as const : undefined;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto select-none"
      >
        {/* Headphone Arc */}
        <motion.path
          d="M 130 230 A 126 126 0 0 1 382 230"
          stroke="#FFD60A"
          strokeWidth={strokeW * 1.5}
          strokeLinecap="round"
          initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
          animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
          transition={pathTransition}
        />

        {/* Headphones Earcups */}
        {/* Left Earcup */}
        <motion.rect
          x="108"
          y="190"
          width="36"
          height="80"
          rx="18"
          fill="#FFD60A"
          initial={animate ? { scale: 0, opacity: 0 } : undefined}
          animate={animate ? { scale: 1, opacity: 1 } : undefined}
          transition={bodyTransition}
          style={{ transformOrigin: '126px 230px' }}
        />
        {/* Right Earcup */}
        <motion.rect
          x="368"
          y="190"
          width="36"
          height="80"
          rx="18"
          fill="#FFD60A"
          initial={animate ? { scale: 0, opacity: 0 } : undefined}
          animate={animate ? { scale: 1, opacity: 1 } : undefined}
          transition={bodyTransition}
          style={{ transformOrigin: '386px 230px' }}
        />

        {/* Book Outer & Center Line */}
        <motion.path
          d="M 256,356 C 230,334 190,334 156,350 L 156,246 C 190,230 230,230 256,252 C 282,230 322,230 356,246 L 356,350 C 322,334 282,334 256,356 Z"
          stroke="#FFD60A"
          strokeWidth={strokeW}
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
          animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
          transition={pathTransition}
        />
        
        {/* Book Center spine */}
        <motion.path
          d="M 256,252 L 256,356"
          stroke="#FFD60A"
          strokeWidth={strokeW}
          strokeLinecap="round"
          initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
          animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
          transition={pathTransition}
        />

        {/* Left Page Writing Lines */}
        <motion.path
          d="M 184,285 L 226,285"
          stroke="#FFD60A"
          strokeWidth={10}
          strokeLinecap="round"
          initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
          animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
          transition={pathTransition}
        />
        <motion.path
          d="M 184,305 L 226,305"
          stroke="#FFD60A"
          strokeWidth={10}
          strokeLinecap="round"
          initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
          animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
          transition={pathTransition}
        />
        <motion.path
          d="M 184,325 L 226,325"
          stroke="#FFD60A"
          strokeWidth={10}
          strokeLinecap="round"
          initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
          animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
          transition={pathTransition}
        />

        {/* Right Page Soundwave Lines */}
        {/* Bar 1 */}
        <motion.line
          x1="286"
          y1="290"
          x2="286"
          y2="310"
          stroke="#FFD60A"
          strokeWidth={10}
          strokeLinecap="round"
          animate={animate ? { y1: [295, 280, 295], y2: [305, 320, 305] } : undefined}
          transition={soundwaveTransition(0)}
        />
        {/* Bar 2 (center) */}
        <motion.line
          x1="306"
          y1="270"
          x2="306"
          y2="330"
          stroke="#FFD60A"
          strokeWidth={10}
          strokeLinecap="round"
          animate={animate ? { y1: [280, 260, 280], y2: [320, 340, 320] } : undefined}
          transition={soundwaveTransition(1)}
        />
        {/* Bar 3 */}
        <motion.line
          x1="326"
          y1="290"
          x2="326"
          y2="310"
          stroke="#FFD60A"
          strokeWidth={10}
          strokeLinecap="round"
          animate={animate ? { y1: [295, 280, 295], y2: [305, 320, 305] } : undefined}
          transition={soundwaveTransition(2)}
        />

        {/* Little sound details right page edge optional, let's keep to 3 bars since book is small */}

        {/* Three People Figures (Inside Arch) */}
        {/* Left Person */}
        <g id="left-person">
          <motion.circle
            cx="210"
            cy="185"
            r="12"
            fill="#FFD60A"
            initial={animate ? { scale: 0, opacity: 0 } : undefined}
            animate={animate ? { scale: 1, opacity: 1 } : undefined}
            transition={bodyTransition}
            style={{ transformOrigin: '210px 185px' }}
          />
          <motion.path
            d="M 194,218 C 194,206 226,206 226,218 Z"
            fill="#FFD60A"
            initial={animate ? { scaleY: 0, opacity: 0 } : undefined}
            animate={animate ? { scaleY: 1, opacity: 1 } : undefined}
            transition={bodyTransition}
            style={{ transformOrigin: '210px 218px' }}
          />
        </g>

        {/* Right Person */}
        <g id="right-person">
          <motion.circle
            cx="302"
            cy="185"
            r="12"
            fill="#FFD60A"
            initial={animate ? { scale: 0, opacity: 0 } : undefined}
            animate={animate ? { scale: 1, opacity: 1 } : undefined}
            transition={bodyTransition}
            style={{ transformOrigin: '302px 185px' }}
          />
          <motion.path
            d="M 286,218 C 286,206 318,206 318,218 Z"
            fill="#FFD60A"
            initial={animate ? { scaleY: 0, opacity: 0 } : undefined}
            animate={animate ? { scaleY: 1, opacity: 1 } : undefined}
            transition={bodyTransition}
            style={{ transformOrigin: '302px 218px' }}
          />
        </g>

        {/* Center Person (Prominent) */}
        <g id="center-person">
          <motion.circle
            cx="256"
            cy="172"
            r="14"
            fill="#FFD60A"
            initial={animate ? { scale: 0, opacity: 0 } : undefined}
            animate={animate ? { scale: 1, opacity: 1 } : undefined}
            transition={bodyTransition}
            style={{ transformOrigin: '256px 172px' }}
          />
          <motion.path
            d="M 236,210 C 236,196 276,196 276,210 Z"
            fill="#FFD60A"
            initial={animate ? { scaleY: 0, opacity: 0 } : undefined}
            animate={animate ? { scaleY: 1, opacity: 1 } : undefined}
            transition={bodyTransition}
            style={{ transformOrigin: '256px 210px' }}
          />
        </g>

        {/* Chat Bubble Above Center Person */}
        <g id="chat-bubble">
          {/* Bubble Rounded Box */}
          <motion.rect
            x="232"
            y="120"
            width="48"
            height="28"
            rx="8"
            fill="#FFD60A"
            initial={animate ? { scale: 0, opacity: 0 } : undefined}
            animate={animate ? { scale: 1, opacity: 1 } : undefined}
            transition={chatBubbleTransition}
            style={{ transformOrigin: '256px 148px' }}
          />
          {/* Bubble Arrow */}
          <motion.path
            d="M 250,148 L 256,155 L 262,148 Z"
            fill="#FFD60A"
            initial={animate ? { scale: 0, opacity: 0 } : undefined}
            animate={animate ? { scale: 1, opacity: 1 } : undefined}
            transition={chatBubbleTransition}
            style={{ transformOrigin: '256px 148px' }}
          />
          {/* Inside Dots */}
          <motion.circle
            cx="244"
            cy="134"
            r="2.5"
            fill="#FFFFFF"
            initial={animate ? { opacity: 0 } : undefined}
            animate={animate ? { opacity: [0, 1, 1, 0, 0] } : undefined}
            transition={animate ? { duration: 2, repeat: Infinity, delay: 1.2 } : undefined}
          />
          <motion.circle
            cx="256"
            cy="134"
            r="2.5"
            fill="#FFFFFF"
            initial={animate ? { opacity: 0 } : undefined}
            animate={animate ? { opacity: [0, 0, 1, 1, 0] } : undefined}
            transition={animate ? { duration: 2, repeat: Infinity, delay: 1.4 } : undefined}
          />
          <motion.circle
            cx="268"
            cy="134"
            r="2.5"
            fill="#FFFFFF"
            initial={animate ? { opacity: 0 } : undefined}
            animate={animate ? { opacity: [0, 0, 0, 1, 0] } : undefined}
            transition={animate ? { duration: 2, repeat: Infinity, delay: 1.6 } : undefined}
          />
        </g>
      </svg>

      {/* Brand Text */}
      {showText && (
        <motion.div
          initial={animate ? { opacity: 0, y: 15 } : undefined}
          animate={animate ? { opacity: 1, y: 0 } : undefined}
          transition={animate ? { delay: 1.2, duration: 0.8 } : undefined}
          className="mt-6 flex flex-col items-center"
        >
          <span 
            className="text-4xl sm:text-5xl font-extrabold tracking-tight text-accent select-none"
            style={{ fontFamily: '"Inter", sans-serif' }}
          >
            StudyO
          </span>
        </motion.div>
      )}
    </div>
  );
}
