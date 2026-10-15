'use client';

import { useState } from 'react';

import { TrophyIllustration } from '@/components/illustrations';
import { Badge, SectionLabel, ScoreRing, Textarea } from '@/components/ui';
import {
  ATS_CATEGORY_DESCRIPTION,
  ATS_CATEGORY_LABEL,
  type AtsCategory,
  type AtsFixTarget,
} from '@/constants';
import { bn } from '@/lib/bn';
import { cn } from '@/lib/cn';

import type { AtsQuickFix, AtsScore, KeywordMatch } from '../types';
import { RuleRow } from './RuleRow';

export interface AtsPanelProps {
  score: AtsScore;
  keywords: KeywordMatch;
  jobDescription: string;
  onJobDescriptionChange: (text: string) => void;
  onNavigate?: (target: AtsFixTarget) => void;
  /** Applies a change a rule offers to make itself, like a text size. */
  onQuickFix?: (fix: AtsQuickFix) => void;
  /** Opens the dialog that makes a tailored copy from the pasted job description. */
  onTailor?: () => void;
}

type View = 'issues' | 'all' | 'target';

const VIEWS: Array<{ value: View; label: string }> = [
  { value: 'issues', label: 'যা ঠিক করতে হবে' },
  { value: 'all', label: 'সব যাচাই' },
  { value: 'target', label: 'লক্ষ্য চাকরি' },
];

/**
 * The score panel.
 *
 * Leads with what to fix rather than what passed: a list of green ticks is
 * reassuring and useless. The full breakdown is one tab away for anyone who
 * wants to see where the number came from.
 */
export const AtsPanel = ({
  score,
  keywords,
  jobDescription,
  onJobDescriptionChange,
  onNavigate,
  onQuickFix,
  onTailor,
}: AtsPanelProps) => {
  const [view, setView] = useState<View>('issues');

  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="border-primary/15 bg-gradient-to-br from-primary-soft via-surface to-accent-soft rounded-card flex flex-col gap-3.5 border p-3.5 shadow-sm">
        <div className="flex items-center gap-4">
          <ScoreRing score={score.total} tone={score.tone} label={score.band} />

          <div className="min-w-0">
            <p className="text-ui-md text-fg font-semibold">মোট স্কোর</p>
            <p className="text-ui-xs text-fg-subtle mt-0.5 leading-snug">
              {score.issues.length === 0
                ? 'সব যাচাই পাস করেছে। এবার পাঠিয়ে দিন।'
                : `${bn(score.issues.length)}টি বিষয় ঠিক করা দরকার, সবচেয়ে জরুরিগুলো আগে।`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Meter
            label="মেশিনের পড়ার যোগ্যতা"
            hint="সফটওয়্যার কি ফাইলটি পড়তে পারে?"
            value={score.readability}
          />
          <Meter
            label="লেখার মান"
            hint="লেখাগুলো কি কিছু প্রমাণ করে?"
            value={score.content}
          />
        </div>

        {score.cappedBy === 'content' ? (
          <p className="bg-warning/10 text-warning rounded-control text-ui-xs px-3 py-2 leading-snug">
            ফাইলটি মেশিনের কাছে {bn(score.uncapped)} স্কোরের মতো পড়া যায়, কিন্তু লেখায় প্রমাণ কম
            থাকায় স্কোর {bn(score.total)}-এ আটকে আছে। শুধু লেখার যাচাইগুলো ঠিক করলেই এটি{' '}
            {bn(score.withContentFixed)}-এ উঠবে। নিচে <strong>+ পয়েন্ট</strong> চিহ্ন দেওয়া সমস্যাগুলো আগে ঠিক করুন: ওগুলো ঠিক না হলে ফরম্যাটিং ঠিক করলেও মোট স্কোর বাড়বে না।
          </p>
        ) : null}
        {score.cappedBy === 'completeness' ? (
          <p className="bg-warning/10 text-warning rounded-control text-ui-xs px-3 py-2 leading-snug">
            জরুরি তথ্যগুলো না দেওয়া পর্যন্ত স্কোর {bn(score.total)}-এ আটকে থাকবে।
          </p>
        ) : null}
      </div>

      <div className="border-border-base bg-surface/60 rounded-card flex flex-col gap-2 border p-3">
        {score.categories.map((category) => (
          <CategoryBar
            key={category.category}
            category={category.category}
            percent={category.percent}
            points={category.points}
            maxPoints={category.maxPoints}
          />
        ))}
      </div>

      {/*
        `whitespace-nowrap` because the panel is 360px and "Needs work" broke
        over two lines inside it, which made one of three equal tabs taller
        than the others and the whole control look misassembled.
      */}
      <div className="bg-surface-2 rounded-control flex gap-0.5 p-0.5">
        {VIEWS.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={view === item.value}
            onClick={() => setView(item.value)}
            className={cn(
              'tap-target text-ui-xs flex-1 rounded-lg px-1.5 py-1.5 font-medium whitespace-nowrap transition',
              view === item.value ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {view === 'issues' ? (
        score.issues.length === 0 ? (
          <div className="hue-emerald bg-hue-soft border-hue/20 rounded-card animate-pop flex flex-col items-center gap-1 border px-4 py-5 text-center">
            <div className="w-28">
              <TrophyIllustration />
            </div>
            <p className="text-fg text-ui-md font-bold">কিছুই বাকি নেই</p>
            <p className="text-fg-muted text-ui">দুটি PDF-ই ডাউনলোড করে আবেদন করুন।</p>
          </div>
        ) : (
          <ul className="divide-border-base divide-y">
            {score.issues.map((rule) => (
              <RuleRow key={rule.id} rule={rule} onNavigate={onNavigate} onQuickFix={onQuickFix} />
            ))}
          </ul>
        )
      ) : null}

      {view === 'all'
        ? score.categories.map((category) => (
            <div key={category.category}>
              <SectionLabel className="mb-1">{ATS_CATEGORY_LABEL[category.category]}</SectionLabel>
              <p className="text-ui-xs text-fg-subtle mb-1">
                {ATS_CATEGORY_DESCRIPTION[category.category]}
              </p>
              <ul className="divide-border-base divide-y">
                {category.rules.map((rule) => (
                  <RuleRow key={rule.id} rule={rule} onNavigate={onNavigate} onQuickFix={onQuickFix} />
                ))}
              </ul>
            </div>
          ))
        : null}

      {view === 'target' ? (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-ui text-fg-muted font-medium">চাকরির বিবরণ</span>
            <Textarea
              rows={8}
              value={jobDescription}
              placeholder="বিজ্ঞপ্তিটি এখানে পেস্ট করুন। এটি শুধু কীওয়ার্ড মেলাতে ব্যবহৃত হয়, আপনার CV-তে কখনো ছাপা হয় না।"
              onChange={(event) => onJobDescriptionChange(event.target.value)}
            />
          </label>

          {onTailor ? (
            <div className="border-primary/20 bg-primary-soft/40 rounded-control flex flex-col gap-2 border p-3">
              <p className="text-fg text-ui font-semibold">এই চাকরির জন্য CV সাজান</p>
              <p className="text-fg-muted text-ui-xs leading-snug">
                যে দক্ষতা ও বুলেট মেলে সেগুলো ওপরে আনে, আর বিজ্ঞপ্তির শব্দগুলো বোল্ড করে। এই CV-ই বদলাবে, নাকি আলাদা একটি কপি সেভ হবে — সেটি আপনি ঠিক করেন। আপনি টিক না দিলে কিছুই যোগ হয় না।
              </p>
              <button
                type="button"
                disabled={jobDescription.trim().length === 0}
                onClick={onTailor}
                className="app-button-primary glint rounded-control text-ui self-start px-3 py-1.5 font-semibold text-white disabled:opacity-50"
              >
                এই চাকরির জন্য সাজান
              </button>
            </div>
          ) : null}

          {keywords.matched.length + keywords.missing.length > 0 ? (
            <>
              <div>
                <SectionLabel className="mb-1.5">নেই ({bn(keywords.missing.length)})</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {keywords.missing.length === 0 ? (
                    <p className="text-ui-xs text-fg-subtle">কিছুই বাদ পড়েনি।</p>
                  ) : (
                    keywords.missing.map((word) => (
                      <Badge key={word} tone="warning">
                        {word}
                      </Badge>
                    ))
                  )}
                </div>
                <p className="text-ui-xs text-fg-subtle mt-2 leading-snug">
                  শুধু সেটাই যোগ করুন, যা সত্যিই আপনার আছে, আর বিজ্ঞপ্তিতে যেভাবে লেখা সেভাবেই লিখুন। যে শব্দের ব্যাপারে আপনি কিছুই জানেন না তা দিয়ে CV ভরালে ফিল্টারে না হলেও ইন্টারভিউতে ধরা পড়বেন।
                </p>
              </div>

              <div>
                <SectionLabel className="mb-1.5">মিলেছে ({bn(keywords.matched.length)})</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {keywords.matched.map((word) => (
                    <Badge key={word} tone="success">
                      {word}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

interface MeterProps {
  label: string;
  hint: string;
  value: number;
}

/** One of the two headline numbers: a label, a bar, and what the number is about. */
const Meter = ({ label, hint, value }: MeterProps) => (
  <div className="bg-surface/70 rounded-control border-border-base border p-2.5">
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-fg text-ui-xs font-semibold">{label}</span>
      <span className="text-fg text-ui-md font-bold tabular-nums">{bn(value)}</span>
    </div>
    <div className="bg-surface-2 mt-1.5 h-1.5 overflow-hidden rounded-full">
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500',
          value >= 75 ? 'bg-success' : value >= 50 ? 'bg-warning' : 'bg-danger',
        )}
        style={{ width: `${value}%` }}
      />
    </div>
    <p className="text-fg-subtle text-ui-2xs mt-1.5 leading-snug">{hint}</p>
  </div>
);

interface CategoryBarProps {
  category: AtsCategory;
  percent: number;
  points: number;
  maxPoints: number;
}

const CategoryBar = ({ category, percent, points, maxPoints }: CategoryBarProps) => (
  <div>
    <div className="text-ui-xs mb-1 flex items-baseline justify-between">
      <span className="text-fg-muted">{ATS_CATEGORY_LABEL[category]}</span>
      <span className="text-fg-subtle tabular-nums">
        {bn(Math.round(points))}/{bn(maxPoints)}
      </span>
    </div>
    <div className="bg-surface-2 h-1.5 overflow-hidden rounded-full">
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500',
          percent >= 85 ? 'bg-success' : percent >= 60 ? 'bg-warning' : 'bg-danger',
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  </div>
);
