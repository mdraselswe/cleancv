'use client';

import { Check } from 'lucide-react';

import { Badge, ColorPicker, SectionLabel, Select, Slider, Switch } from '@/components/ui';
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
import { getTemplate, getTemplatesByCategory } from '@/features/templates';
import { cn } from '@/lib/cn';

const FONT_OPTIONS = FONT_FAMILIES.map((value) => ({ value, label: FONT_FAMILY_LABEL[value] }));
const DENSITY_OPTIONS = DENSITIES.map((value) => ({ value, label: DENSITY_LABEL[value] }));

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

  return (
    <div className="flex flex-col gap-6">
      {TEMPLATE_CATEGORIES.map((category) => {
        const templates = getTemplatesByCategory(category);
        if (templates.length === 0) return null;

        return (
          <div key={category}>
            <div className="mb-1 flex items-center gap-2">
              <SectionLabel>{TEMPLATE_CATEGORY_LABEL[category]}</SectionLabel>
            </div>
            <p className="mb-2.5 text-[12px] text-fg-subtle">{TEMPLATE_CATEGORY_HINT[category]}</p>

            <div className="grid grid-cols-2 gap-2">
              {templates.map(({ meta }) => {
                const selected = meta.id === templateId;

                return (
                  <button
                    key={meta.id}
                    type="button"
                    onClick={() => actions.setTemplate(meta.id, meta.defaultTheme)}
                    aria-pressed={selected}
                    className={cn(
                      'flex flex-col gap-1 rounded-xl border p-3 text-left transition',
                      selected
                        ? 'border-primary bg-primary-soft'
                        : 'border-border-base hover:border-border-strong',
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="text-[13px] font-medium text-fg">{meta.name}</span>
                      {selected ? <Check size={13} className="text-primary" /> : null}
                    </span>
                    <span className="text-[12px] leading-snug text-fg-subtle">
                      {meta.description}
                    </span>
                    <Badge tone={meta.atsBaseline >= 90 ? 'success' : 'warning'} className="mt-1 self-start">
                      ATS ceiling {meta.atsBaseline}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex flex-col gap-4 border-t border-border-base pt-5">
        <SectionLabel>Typography and spacing</SectionLabel>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-fg-muted">Font</span>
            <Select
              options={FONT_OPTIONS}
              value={theme.font}
              onChange={(event) => actions.setTheme({ font: event.target.value as FontFamilyKey })}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-fg-muted">Density</span>
            <Select
              options={DENSITY_OPTIONS}
              value={theme.density}
              onChange={(event) => actions.setTheme({ density: event.target.value as Density })}
            />
          </label>
        </div>

        <Slider
          label="Text size"
          min={FONT_SCALE.min}
          max={FONT_SCALE.max}
          step={FONT_SCALE.step}
          value={theme.fontScale}
          display={`${Math.round(theme.fontScale * 100)}%`}
          onChange={(fontScale) => actions.setTheme({ fontScale })}
        />

        <Slider
          label="Page margin"
          min={PAGE_MARGIN_MM.min}
          max={PAGE_MARGIN_MM.max}
          step={PAGE_MARGIN_MM.step}
          value={theme.marginMm}
          display={`${theme.marginMm} mm`}
          onChange={(marginMm) => actions.setTheme({ marginMm })}
        />

        {active.meta.supports.accentColor ? (
          <ColorPicker
            label="Accent colour"
            value={theme.accent}
            swatches={ACCENT_PRESETS}
            onChange={(accent) => actions.setTheme({ accent })}
          />
        ) : (
          <p className="text-[12px] text-fg-subtle">
            {active.meta.name} prints in black for maximum parse reliability, so the accent colour is
            not used.
          </p>
        )}

        {active.meta.supports.photo ? (
          <>
            <Switch
              checked={theme.showPhoto}
              onChange={(showPhoto) => actions.setTheme({ showPhoto })}
              label="Show photo"
              description="Upload it in the Profile section."
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
                        'flex flex-1 flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 transition',
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
                      <span className="text-fg text-[12px]">{shape.label}</span>
                    </button>
                  ))}
                </div>

                <Slider
                  label="Corner radius"
                  min={PHOTO_RADIUS.min}
                  max={PHOTO_RADIUS.max}
                  step={PHOTO_RADIUS.step}
                  value={theme.photoRadius}
                  display={`${theme.photoRadius}%`}
                  onChange={(photoRadius) => actions.setTheme({ photoRadius })}
                />
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-[12px] text-fg-subtle">
            {active.meta.name} does not print a photo — the single biggest parse hazard.
          </p>
        )}
      </div>
    </div>
  );
};
