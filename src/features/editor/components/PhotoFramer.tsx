'use client';

import { RotateCcw } from 'lucide-react';
import { useRef, type PointerEvent as ReactPointerEvent } from 'react';

import { Button, Slider } from '@/components/ui';
import { PHOTO_FRAME } from '@/constants';
import type { PhotoFrame } from '@/features/resume';
import { bnPercent } from '@/lib/bn';

export interface PhotoFramerProps {
  photo: string;
  frame: PhotoFrame;
  onChange: (frame: PhotoFrame) => void;
}

const DEFAULT_FRAME: PhotoFrame = {
  x: PHOTO_FRAME.position.default,
  y: PHOTO_FRAME.position.default,
  zoom: PHOTO_FRAME.zoom.default,
};

const clamp = (value: number) =>
  Math.min(PHOTO_FRAME.position.max, Math.max(PHOTO_FRAME.position.min, value));

const isDefault = (frame: PhotoFrame) =>
  frame.x === DEFAULT_FRAME.x && frame.y === DEFAULT_FRAME.y && frame.zoom === DEFAULT_FRAME.zoom;

/**
 * Framing the photo without touching it.
 *
 * A square box cropped from a portrait photo takes the middle, which is where
 * the chin usually is — the head goes over the top edge and there is no way to
 * say otherwise. Dragging here moves the point the frame centres on, and the
 * zoom pulls back or in about that same point. The uploaded image is untouched,
 * so a bad frame is one drag away from being right rather than another upload.
 * See ADR-025.
 *
 * The preview is a real square: the designs crop to squares and circles, and a
 * letterboxed preview would show a frame nobody gets.
 */
export const PhotoFramer = ({ photo, frame, onChange }: PhotoFramerProps) => {
  const box = useRef<HTMLDivElement | null>(null);
  const from = useRef<{ x: number; y: number; frame: PhotoFrame } | null>(null);

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    from.current = { x: event.clientX, y: event.clientY, frame };
  };

  // Always attached, and a no-op until a drag has started: reading the ref
  // during render to decide whether to attach it is reading it too early.
  const drag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = from.current;
    const bounds = box.current?.getBoundingClientRect();
    if (!start || !bounds) return;

    /*
     * Dragging the image down should reveal what is above it, so the focal
     * point moves the opposite way to the pointer — the same direction a hand
     * moves a photo under a mask.
     */
    onChange({
      ...start.frame,
      x: clamp(start.frame.x - ((event.clientX - start.x) / bounds.width) * 100),
      y: clamp(start.frame.y - ((event.clientY - start.y) / bounds.height) * 100),
    });
  };

  const endDrag = () => {
    from.current = null;
  };

  return (
    <div className="flex gap-3">
      <div
        ref={box}
        role="presentation"
        onPointerDown={startDrag}
        onPointerMove={drag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        title="ফ্রেমের ভেতরে ছবি সরাতে টেনে আনুন"
        className="border-border-base h-24 w-24 flex-none cursor-grab overflow-hidden rounded-xl border active:cursor-grabbing"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt=""
          draggable={false}
          className="h-full w-full select-none object-cover"
          style={{
            objectPosition: `${frame.x}% ${frame.y}%`,
            transform: `scale(${frame.zoom})`,
            transformOrigin: `${frame.x}% ${frame.y}%`,
          }}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Slider
          label="জুম"
          min={PHOTO_FRAME.zoom.min}
          max={PHOTO_FRAME.zoom.max}
          step={PHOTO_FRAME.zoom.step}
          value={frame.zoom}
          display={bnPercent(frame.zoom * 100)}
          onChange={(zoom) => onChange({ ...frame, zoom })}
        />

        <p className="text-fg-subtle text-ui-xs">
          ফ্রেমে ছবির কোন অংশ থাকবে তা ঠিক করতে ছবিটি টানুন। মূল ফাইল থেকে কিছুই কাটা হয় না।
        </p>

        {!isDefault(frame) ? (
          <Button
            size="sm"
            variant="ghost"
            className="-ml-2 self-start"
            leading={<RotateCcw size={13} />}
            onClick={() => onChange(DEFAULT_FRAME)}
          >
            মাঝখানে আনুন
          </Button>
        ) : null}
      </div>
    </div>
  );
};
