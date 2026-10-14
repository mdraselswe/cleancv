'use client';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { GripVertical, Lock } from 'lucide-react';
import { useState } from 'react';

import { Modal, ModalHeader } from '@/components/ui';
import type { SectionSlot } from '@/constants';
import {
  getSectionHeading,
  useResume,
  useResumeActions,
  withoutHiddenEntries,
} from '@/features/resume';
import { getTemplate } from '@/features/templates';
import { bn } from '@/lib/bn';
import { cn } from '@/lib/cn';

import { useSectionMap, type SectionBox } from '../hooks/useSectionMap';

export interface SectionMapProps {
  onClose: () => void;
}

/** Placed by measurement, so the box on screen is the shape on the page. */
const place = (box: SectionBox) => ({
  left: `${box.x * 100}%`,
  top: `${box.y * 100}%`,
  width: `${box.width * 100}%`,
  height: `${box.height * 100}%`,
});

const BOX_CLASS =
  'absolute flex items-center justify-center rounded-lg border px-1.5 text-center text-ui-2xs leading-tight';

interface BoxProps {
  box: SectionBox;
  label: string;
}

/**
 * The first piece of a section: the one that can be picked up.
 *
 * A section running over a page boundary draws a box on each page, and only
 * this one takes the handle — the same section cannot be two different things
 * to drop onto.
 */
const DraggableBox = ({ box, label }: BoxProps) => {
  const { attributes, listeners, setNodeRef, isDragging, isOver } = useSortable({ id: box.slot });

  return (
    <div
      ref={setNodeRef}
      data-slot={box.slot}
      style={place(box)}
      className={cn(
        BOX_CLASS,
        'border-border-base bg-app-primary/10 text-fg cursor-grab touch-none transition-colors select-none',
        // The one being carried stays as a hole; the overlay is what moves.
        isDragging && 'border-dashed opacity-35',
        isOver && !isDragging && 'border-app-primary bg-app-primary/25 ring-app-primary ring-2',
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical size={11} className="text-fg-subtle absolute top-1 left-1" aria-hidden="true" />
      <span className="line-clamp-3 px-2">{label}</span>
    </div>
  );
};

/** The rest of a section, on the pages it ran on to. */
const ContinuedBox = ({ box, label }: BoxProps) => (
  <div
    style={place(box)}
    className={cn(BOX_CLASS, 'border-border-base bg-app-primary/5 text-fg-subtle border-dashed')}
  >
    <span className="line-clamp-3 px-2">{label} (cont.)</span>
  </div>
);

/**
 * The document as pages of boxes, dragged to reorder.
 *
 * The list in the panel behind this one says what order the sections are in;
 * this says what that order *does* — which page a section lands on, which
 * column it sits in on a two-column design, and how much of the page it eats.
 * Reordering by dragging the shape you are looking at is the whole point, so
 * both exist rather than one replacing the other. See ADR-042.
 */
export const SectionMap = ({ onClose }: SectionMapProps) => {
  const resume = useResume();
  const actions = useResumeActions();
  const { Template } = getTemplate(resume.meta.templateId);
  /*
   * Destructured here rather than kept as one object: the map carries the ref
   * the hidden copy attaches to, and a value read off an object holding a ref
   * reads to React's lint rules as reading the ref itself.
   */
  const { measureRef, flowWidth, margin, pages, headers, twoColumn } = useSectionMap();
  const [carried, setCarried] = useState<{ label: string; width: number; height: number } | null>(
    null,
  );

  const sensors = useSensors(
    // A small threshold keeps a click on a box from starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const slots = pages.flatMap((page) =>
    page.boxes.filter((box) => box.head).map((box) => box.slot),
  );

  const heads = pages.flatMap((page) => page.boxes.filter((box) => box.head));

  const handleDragStart = ({ active }: DragStartEvent) => {
    const box = heads.find((item) => item.slot === active.id);
    if (!box) return;

    /*
     * Sized from the box on screen rather than from `active.rect`, which dnd-kit
     * has not filled in yet at this point — an overlay with no size is an
     * overlay nobody sees.
     */
    const node = document.querySelector<HTMLElement>(`[data-slot="${box.slot}"]`);
    const rect = node?.getBoundingClientRect();

    setCarried({
      label: getSectionHeading(resume, box.slot),
      width: rect?.width ?? 120,
      height: rect?.height ?? 40,
    });
  };

  /*
   * Dropping on a box means "put me here", and here is a column as well as a
   * position — which is what lets a section be dragged out of the panel and
   * into the narrative. One action, so one drag is one thing to undo.
   */
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setCarried(null);
    if (!over || active.id === over.id) return;

    const slot = String(active.id) as SectionSlot;
    const target = heads.find((item) => item.slot === over.id);
    const index = resume.meta.sectionOrder.indexOf(String(over.id) as SectionSlot);
    if (!target || index === -1) return;

    actions.placeSection(slot, index, twoColumn ? target.column : 'main');
  };

  return (
    <>
      {/*
        `Modal` centres by flex rather than by a translate, which is what lets
        the drag overlay work inside it: a transform on an ancestor is what
        `position: fixed` resolves against, and dnd-kit positions the carried
        box in viewport coordinates. See ADR-043.
      */}
      <Modal label="সেকশন সাজান" onClose={onClose} className="max-w-[620px]">
        <ModalHeader
          title="বাক্সগুলো ধরে টেনে সেকশন সাজান"
          subtitle="প্রতিটি বাক্স ঠিক সেই জায়গায় ও সেই মাপে আঁকা, যেখানে সেকশনটি আসলে পড়ে।"
          onClose={onClose}
        />

        <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setCarried(null)}
            accessibility={{
              screenReaderInstructions: {
                draggable:
                  'সরানোর জন্য একটি বাক্স তুলতে স্পেস বার চাপুন। টানার সময় তীর কী দিয়ে বাক্সটি সরান। আবার স্পেস বার চাপলে বাক্সটি নতুন জায়গায় বসবে, আর Esc চাপলে সরানো বাতিল হবে।',
              },
            }}
          >
            <SortableContext items={slots} strategy={rectSortingStrategy}>
              <div className="flex flex-col items-center gap-5">
                {pages.map((page, index) => (
                  <div key={index} className="w-full max-w-[380px]">
                    <p className="text-fg-subtle text-ui-xs mb-1.5 text-center">
                      পৃষ্ঠা {bn(index + 1)} / {bn(pages.length)}
                    </p>
                    <div className="border-border-base bg-surface shadow-app rounded-control relative aspect-[210/297] w-full border">
                      <div
                        className="absolute"
                        style={{
                          left: `${margin.x * 100}%`,
                          right: `${margin.x * 100}%`,
                          top: `${margin.y * 100}%`,
                          bottom: `${margin.y * 100}%`,
                        }}
                      >
                        {index === 0
                          ? headers.map((band) => (
                              <div
                                key={band.x}
                                className={cn(
                                  BOX_CLASS,
                                  'border-border-base bg-app-primary/20 text-fg top-0',
                                )}
                                style={{
                                  left: `${band.x * 100}%`,
                                  width: `${band.width * 100}%`,
                                  height: `${band.height * 100}%`,
                                }}
                              >
                                <Lock
                                  size={11}
                                  className="text-fg-subtle absolute top-1 left-1"
                                  aria-hidden="true"
                                />
                                <span>হেডার</span>
                              </div>
                            ))
                          : null}

                        {page.boxes.map((box) => {
                          const label = getSectionHeading(resume, box.slot);

                          return box.head ? (
                            <DraggableBox key={box.key} box={box} label={label} />
                          ) : (
                            <ContinuedBox key={box.key} box={box} label={label} />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SortableContext>

            {/* Follows the pointer, so the gesture reads as carrying the box
                rather than as the page rearranging itself underneath it. */}
            <DragOverlay dropAnimation={null}>
              {carried ? (
                <div
                  data-drag-overlay=""
                  style={{ width: carried.width, height: carried.height }}
                  className="border-app-primary bg-surface shadow-app text-fg text-ui-2xs flex cursor-grabbing items-center justify-center rounded-lg border px-1.5 text-center leading-tight"
                >
                  <span className="line-clamp-3 px-2">{carried.label}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </Modal>

      {/*
        The copy the map is measured from: the real template at real page width,
        parked off screen. Not `display: none` — a box with no layout has no
        geometry to read. See ADR-042.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 -z-10 opacity-0"
        style={{ left: -10_000, width: flowWidth }}
      >
        <div ref={measureRef}>
          <Template resume={withoutHiddenEntries(resume)} />
        </div>
      </div>
    </>
  );
};
