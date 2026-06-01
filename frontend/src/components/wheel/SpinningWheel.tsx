'use client';

import { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import type { WheelPrize } from '@scentresort/shared';

interface Props {
  prizes: WheelPrize[];
  winningIndex: number | null;
  onSpinComplete: () => void;
  spinning: boolean;
}

// Emoji for each prize type
const TYPE_EMOJI: Record<string, string> = {
  fragrance: '\uD83E\uDDF4',
  sample: '\uD83E\uDDEA',
  merch: '\u2B50',
  credit: '\uD83D\uDCB0',
  voucher: '\uD83D\uDE9A',
};

// Segment color by rarity — based on probability
function getSegmentColor(probability: number): string {
  if (probability <= 0.01) return '#B8860B';   // gold — legendary (<1%)
  if (probability <= 0.05) return '#7B2D8E';   // purple — rare (<5%)
  if (probability <= 0.10) return '#2563EB';   // blue — uncommon (<10%)
  if (probability <= 0.20) return '#16A34A';   // green — common (<20%)
  return '#444444';                             // gray — very common (>20%)
}

function getSegmentStroke(probability: number): string {
  if (probability <= 0.01) return '#DAA520';
  if (probability <= 0.05) return '#9B3FB8';
  if (probability <= 0.10) return '#3B82F6';
  if (probability <= 0.20) return '#22C55E';
  return '#555555';
}

export function SpinningWheel({ prizes, winningIndex, onSpinComplete, spinning }: Props) {
  const controls = useAnimation();
  const [currentRotation, setCurrentRotation] = useState(0);

  useEffect(() => {
    if (spinning && winningIndex !== null) {
      const segmentAngle = 360 / prizes.length;
      const segmentCenter = segmentAngle * winningIndex + segmentAngle / 2;
      const finalAngle = (270 - segmentCenter + 360) % 360;

      const extraNeeded = (finalAngle - (currentRotation % 360) + 360) % 360;
      const fullSpins = 5 + Math.floor(Math.random() * 3);
      const totalRotation = currentRotation + fullSpins * 360 + extraNeeded;

      controls.start({
        rotate: totalRotation,
        transition: {
          duration: 4 + Math.random() * 1.5,
          ease: [0.2, 0.8, 0.3, 1],
        },
      }).then(() => {
        setCurrentRotation(totalRotation % 360);
        onSpinComplete();
      });
    }
  }, [spinning, winningIndex]);

  const segmentAngle = 360 / prizes.length;
  const size = 400;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 2;

  return (
    <div className="relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] mx-auto">
      {/* Pointer at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
        <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-l-transparent border-r-transparent border-t-accent drop-shadow-lg" />
      </div>

      {/* Wheel */}
      <motion.div
        animate={controls}
        className="w-full h-full rounded-full overflow-hidden relative"
        style={{
          transformOrigin: 'center center',
          boxShadow: '0 0 0 3px #222, 0 0 0 5px #111, 0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
          {prizes.map((prize, i) => {
            const startAngle = (i * segmentAngle * Math.PI) / 180;
            const endAngle = ((i + 1) * segmentAngle * Math.PI) / 180;
            const midAngle = (startAngle + endAngle) / 2;

            const x1 = cx + radius * Math.cos(startAngle);
            const y1 = cy + radius * Math.sin(startAngle);
            const x2 = cx + radius * Math.cos(endAngle);
            const y2 = cy + radius * Math.sin(endAngle);
            const largeArc = segmentAngle > 180 ? 1 : 0;

            const segPath = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
            const color = getSegmentColor(prize.probability);
            const stroke = getSegmentStroke(prize.probability);

            // Emoji position
            const emojiRadius = radius * 0.65;
            const emojiX = cx + emojiRadius * Math.cos(midAngle);
            const emojiY = cy + emojiRadius * Math.sin(midAngle);

            // Text position
            const textRadius = radius * 0.40;
            const textX = cx + textRadius * Math.cos(midAngle);
            const textY = cy + textRadius * Math.sin(midAngle);
            const textRotation = (midAngle * 180) / Math.PI;

            return (
              <g key={prize.id}>
                {/* Segment fill */}
                <path d={segPath} fill={color} />
                {/* Subtle darker inner edge */}
                <path d={segPath} fill="url(#segGrad)" opacity="0.3" />
                {/* Divider lines */}
                <line
                  x1={cx} y1={cy}
                  x2={x1} y2={y1}
                  stroke="#000"
                  strokeWidth="1.5"
                  opacity="0.5"
                />

                {/* Emoji */}
                <text
                  x={emojiX}
                  y={emojiY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ fontSize: '26px' }}
                  transform={`rotate(${(midAngle * 180) / Math.PI}, ${emojiX}, ${emojiY})`}
                >
                  {TYPE_EMOJI[prize.type] || '\uD83C\uDF81'}
                </text>

                {/* Prize name */}
                <text
                  x={textX}
                  y={textY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                  fill="#fff"
                  fontWeight="bold"
                  style={{ fontSize: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}
                >
                  {prize.name.length > 14 ? prize.name.slice(0, 12) + '..' : prize.name}
                </text>
              </g>
            );
          })}

          {/* Radial gradient overlay for depth */}
          <defs>
            <radialGradient id="segGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#000" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Outer ring */}
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#333" strokeWidth="3" />

          {/* Center hub */}
          <circle cx={cx} cy={cy} r="32" fill="#0a0a0a" stroke="#333" strokeWidth="2" />
          <circle cx={cx} cy={cy} r="26" fill="none" stroke="#DB4A2B" strokeWidth="1.5" />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#fff"
            fontWeight="bold"
            style={{ fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase' }}
          >
            SPIN
          </text>
        </svg>
      </motion.div>
    </div>
  );
}
