'use client';

import { Check, Type } from 'lucide-react';
import { useState } from 'react';

import { Badge, ColorPicker, HueIcon, SectionLabel, Select, Slider, Switch } from '@/components/ui';
import {
  ACCENT_PRESETS,
  DENSITIES,
  DENSITY_LABEL,
  FONT_FAMILIES,
  FONT_FAMILY_LABEL,
  FONT_SCALE,
  PAGE_MARGIN_MM,
  PHOTO_RADIUS,
  PHOTO_SHAPES,
  TEMPLATE_CATEGORIES,
  TEMPLATE_CATEGORY_HINT,
  TEMPLATE_CATEGORY_LABEL,
} from '@/constants';
import type { Density, FontFamilyKey } from '@/constants';
import { useResume, useResumeActions } from '@/features/resume';
import { TemplatePreview, getTemplate, getTemplatesByCategory } from '@/features/templates';
import { bn, bnPercent } from '@/lib/bn';
import { cn } from '@/lib/cn';

const FONT_OPTIONS = FONT_FAMILIES.map((value) => ({ value, label: FONT_FAMILY_LABEL[value] }));
const DENSITY_OPTIONS = DENSITIES.map((value) => ({ value, label: DENSITY_LABEL[value] }));

/**
 * Rendered width of a thumbnail, in pixels.
 *
 * Small enough that two sit side by side in the narrowest pane the editor has,
 * large enough that a rail, a panel and a centred head are all obviously
 * different things. Fixed rather than fluid: the page is scaled by this number
 * and a value that changes with the container re-renders ten resumes on every
 * drag of the pane divider.
 */
const THUMBNAIL_WIDTH = 150;

/**
 * Template choice and document theme.
 *
 * Each template advertises what it supports, so controls it ignores are hidden
 * rather than shown and silently discarded.
 */
export const DesignSection = () => {
  const resume = useResume();
  const actions = useResumeActions();
  const { theme, templateId } = resume.meta;
  const active = getTemplate(templateId);
  const [filter, setFilter] = useState<'all' | (typeof TEMPLATE_CATEGORIES)[number]>('all');

  return (
    <div className="flex flex-col gap-6">
      <div
        role="group"
        aria-label="ডিজাইন ছাঁকুন"
        className="scroll-none -mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5"
      >
        {(['all', ...TEMPLATE_CATEGORIES] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={cn(
              'tap-target text-ui flex-none rounded-full border px-3 py-1 font-medium whitespace-nowrap transition',
              filter === value
                ? 'app-gradient-bg border-transparent text-white shadow-sm'
                : 'border-border-base bg-surface text-fg-muted hover:border-primary/40 hover:text-fg',
            )}
          >
            {value === 'all' ? 'সব ডিজাইন' : TEMPLATE_CATEGORY_LABEL[value]}
          </button>
        ))}
      </div>

      {TEMPLATE_CATEGORIES.map((category) => {
        if (filter !== 'all' && filter !== category) return null;

        const templates = getTemplatesByCategory(category);
        if (templates.length === 0) return null;

        return (
          <div key={category}>
            <div className="mb-1 flex items-center gap-2">
              <SectionLabel>{TEMPLATE_CATEGORY_LABEL[category]}</SectionLabel>
            </div>
            <p className="text-ui-xs text-fg-subtle mb-2.5">{TEMPLATE_CATEGORY_HINT[category]}</p>

            <div className="grid grid-cols-2 gap-2.5">
              {templates.map(({ meta }) => {
                const selected = meta.id === templateId;

                return (
                  <button
                    key={meta.id}
                    type="button"
                    onClick={() => actions.setTemplate(meta.id, meta.defaultTheme)}
                    aria-pressed={selected}
                    title={meta.description}
                    className={cn(
                      'group card-lift rounded-card flex flex-col overflow-hidden border text-left',
                      selected
                        ? 'border-primary ring-primary/30 ring-2'
                        : 'border-border-base hover:border-primary/40',
                    )}
                  >
                    <span className="bg-canvas relative flex justify-center overflow-hidden p-2">
                      <span className="shadow-sheet block overflow-hidden rounded-[2px]">
                        <TemplatePreview
                          templateId={meta.id}
                          resume={resume}
                          width={THUMBNAIL_WIDTH}
                        />
                      </span>

                      {selected ? (
                        <span className="bg-primary text-primary-fg absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full">
                          <Check size={13} strokeWidth={3} />
                        </span>
                      ) : null}
                    </span>

                    <span
                      className={cn(
                        'flex flex-1 flex-col gap-1 border-t px-2.5 py-2 transition',
                        selected ? 'border-primary/40 bg-primary-soft' : 'border-border-base',
                      )}
                    >
                      <span className="text-fg text-ui font-medium">{meta.name}</span>
                      <Badge
                        tone={meta.atsBaseline >= 90 ? 'success' : 'warning'}
                        className="self-start"
                      >
                        ATS সীমা {bn(meta.atsBaseline)}
                      </Badge>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="border-border-base bg-surface-2/40 rounded-panel flex flex-col gap-4 border p-4">
        <div className="hue-violet flex items-center gap-2.5">
          <HueIcon hue="violet" size="sm">
            <Type size={15} />
          </HueIcon>
          <SectionLabel>লেখার ধরন ও ফাঁকা জায়গা</SectionLabel>
        </div>

        <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-ui text-fg-muted font-medium">ফন্ট</span>
            <Select
              options={FONT_OPTIONS}
              value={theme.font}
              onChange={(event) => actions.setTheme({ font: event.target.value as FontFamilyKey })}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-ui text-fg-muted font-medium">ঘনত্ব</span>
            <Select
              options={DENSITY_OPTIONS}
              value={theme.density}
              onChange={(event) => actions.setTheme({ density: event.target.value as Density })}
            />
          </label>
        </div>

        <Slider
          label="লেখার আকার"
          min={FONT_SCALE.min}
          max={FONT_SCALE.max}
          step={FONT_SCALE.step}
          value={theme.fontScale}
          display={bnPercent(theme.fontScale * 100)}
          onChange={(fontScale) => actions.setTheme({ fontScale })}
        />

        <Slider
          label="পেজের মার্জিন"
          min={PAGE_MARGIN_MM.min}
          max={PAGE_MARGIN_MM.max}
          step={PAGE_MARGIN_MM.step}
          value={theme.marginMm}
          display={`${bn(theme.marginMm)} মিমি`}
          onChange={(marginMm) => actions.setTheme({ marginMm })}
        />

        {active.meta.supports.accentColor ? (
          <ColorPicker
            label="প্রধান রং"
            value={theme.accent}
            swatches={ACCENT_PRESETS}
            onChange={(accent) => actions.setTheme({ accent })}
          />
        ) : (
          <p className="text-ui-xs text-fg-subtle">
            {active.meta.name} সর্বোচ্চ পার্সিং নির্ভরযোগ্যতার জন্য কালো রঙে ছাপা হয়, তাই প্রধান রং
            এখানে কাজ করে না।
          </p>
        )}

        {active.meta.supports.photo ? (
          <>
            <Switch
              checked={theme.showPhoto}
              onChange={(showPhoto) => actions.setTheme({ showPhoto })}
              label="ছবি দেখান"
              description="ছবিটি “প্রোফাইল” সেকশনে আপলোড করুন।"
            />

            {/*
              Shape and radius are one setting, not two: the named shapes are
              positions on the same scale the slider moves along, so they can
              never disagree with it. See ADR-024.
            */}
            {theme.showPhoto ? (
              <div className="flex flex-col gap-3 pl-12">
                <div className="flex gap-2">
                  {PHOTO_SHAPES.map((shape) => (
                    <button
                      key={shape.id}
                      type="button"
                      aria-pressed={theme.photoRadius === shape.radius}
                      onClick={() => actions.setTheme({ photoRadius: shape.radius })}
                      className={cn(
                        'rounded-card flex flex-1 flex-col items-center gap-1.5 border px-2 py-2.5 transition',
                        theme.photoRadius === shape.radius
                          ? 'border-primary bg-primary-soft'
                          : 'border-border-base hover:border-border-strong',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="border-fg-subtle h-6 w-6 border-2"
                        style={{ borderRadius: `${shape.radius}%` }}
                      />
                      <span className="text-fg text-ui-xs">{shape.label}</span>
                    </button>
                  ))}
                </div>

                <Slider
                  label="কোণের গোলাকার ভাব"
                  min={PHOTO_RADIUS.min}
                  max={PHOTO_RADIUS.max}
                  step={PHOTO_RADIUS.step}
                  value={theme.photoRadius}
                  display={bnPercent(theme.photoRadius)}
                  onChange={(photoRadius) => actions.setTheme({ photoRadius })}
                />
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-ui-xs text-fg-subtle">
            {active.meta.name} ছবি ছাপে না — পার্সারের জন্য ছবিই সবচেয়ে বড় ঝুঁকি।
          </p>
        )}
      </div>
    </div>
  );
};
