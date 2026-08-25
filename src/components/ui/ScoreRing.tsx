'use client';

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
    <div className={cn('relative inline-flex flex-none', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`ATS score ${clamped} out of 100`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--app-border)"
          strokeWidth={stroke}
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
          className="text-[1.75rem] font-semibold leading-none tabular-nums"
          style={{ color: TONE_VAR[tone] }}
        >
          {clamped}
        </span>
        {label ? (
          <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-fg-subtle">
            {label}
          </span>
        ) : null}
      </span>
    </div>
  );
};
