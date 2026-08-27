'use client';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface SortableListProps {
  ids: readonly string[];
  onReorder: (from: number, to: number) => void;
  children: ReactNode;
  className?: string;
  ariaLabel: string;
}

/**
 * Vertical drag-to-reorder.
 *
 * Dragging is the fast path, not the only one: every list that uses this also
 * exposes move-up / move-down buttons, so reordering never depends on a pointer.
 */
export const SortableList = ({
  ids,
  onReorder,
  children,
  className,
  ariaLabel,
}: SortableListProps) => {
  const sensors = useSensors(
    // A small threshold keeps a click on a card from starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;

    onReorder(from, to);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
      accessibility={{ announcements: undefined }}
    >
      <SortableContext items={[...ids]} strategy={verticalListSortingStrategy}>
        <div role="list" aria-label={ariaLabel} className={className}>
          {children}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export interface SortableItemProps {
  id: string;
  /** Receives the drag handle to place inside the row. */
  children: (handle: ReactNode) => ReactNode;
}

export const SortableItem = ({ id, children }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const handle = (
    <button
      ref={setActivatorNodeRef}
      type="button"
      aria-label="Reorder"
      className="tap-target text-fg-subtle hover:bg-surface-2 hover:text-fg flex h-9 w-8 cursor-grab items-center justify-center rounded-lg transition active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <GripVertical size={14} />
    </button>
  );

  return (
    <div
      ref={setNodeRef}
      role="listitem"
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'shadow-pop relative z-10 opacity-95')}
    >
      {children(handle)}
    </div>
  );
};
