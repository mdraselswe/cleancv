'use client';

import { bn } from '@/lib/bn';
import { cn } from '@/lib/cn';

export type ScoreTone = 'excellent' | 'strong' | 'fair' | 'poor';

const TONE_VAR: Record<ScoreTone, string> = {
  excellent: 'var(--score-excellent)',
  strong: 'var(--score-strong)',
  fair: 'var(--score-fair)',
  poor: 'var(--score-poor)',
};

export interface ScoreRingProps {
  /** 0-100. */
  score: number;
  tone: ScoreTone;
  label?: string;
  size?: number;
  className?: string;
}

/**
 * The ATS score dial. Pure SVG so it renders identically in both themes and
 * needs no chart dependency.
 */
export const ScoreRing = ({ score, tone, label, size = 116, className }: ScoreRingProps) => {
  const stroke = size * 0.085;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const dash = (clamped / 100) * circumference;

  return (
    <div
      className={cn('relative inline-flex flex-none', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`ATS স্কোর ${bn(clamped)}, ১০০-এর মধ্যে`}
      >
        {/*
          The track is drawn thinner than the arc that covers it. At the same
          weight the sliver still showing at a high score reads as a stray grey
          dot floating at the top of the ring rather than as the little that is
          left to earn — the round caps close over it from both sides and only
          its middle survives.
        */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--app-border)"
          strokeWidth={stroke * 0.55}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={TONE_VAR[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 420ms cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>

      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-semibold tabular-nums"
          style={{ color: TONE_VAR[tone], fontSize: size * 0.26, lineHeight: 1 }}
        >
          {bn(clamped)}
        </span>
        {label ? (
          <span className="text-fg-subtle text-ui-2xs mt-1 font-medium">
            {label}
          </span>
        ) : null}
      </span>
    </div>
  );
};
