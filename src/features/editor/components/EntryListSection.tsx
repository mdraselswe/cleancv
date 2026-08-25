'use client';

import { ChevronDown, ChevronUp, Copy, Plus, Trash2 } from 'lucide-react';

import { Button, CollapsibleCard, EmptyState, SortableItem, SortableList } from '@/components/ui';
import type { EntryListKey } from '@/features/resume';
import { isBlank } from '@/lib/text';

import { ENTRY_SECTIONS } from '../fields/entrySections';
import { FieldRenderer } from '../fields/FieldRenderer';
import { useEntrySection } from '../hooks/useEntrySection';

export interface EntryListSectionProps {
  sectionKey: EntryListKey;
}

/**
 * One editor for all fifteen repeatable sections.
 *
 * The section's identity comes entirely from its config in `entrySections.ts`;
 * the add / remove / reorder / collapse behaviour is shared, which is why a new
 * section costs a config entry rather than a new component.
 */
export const EntryListSection = ({ sectionKey }: EntryListSectionProps) => {
  const config = ENTRY_SECTIONS[sectionKey];
  const section = useEntrySection(sectionKey);

  if (section.entries.length === 0) {
    return (
      <EmptyState
        title={config.emptyTitle}
        description={config.emptyDescription}
        action={
          <Button variant="primary" size="sm" leading={<Plus size={14} />} onClick={section.add}>
            {config.addLabel}
          </Button>
        }
      />
    );
  }

  const ids = section.entries.map((entry) => entry.id as string);

  return (
    <div className="flex flex-col gap-2">
      <SortableList
        ids={ids}
        onReorder={section.move}
        ariaLabel={`${config.addLabel} entries`}
        className="flex flex-col gap-2"
      >
        {section.entries.map((entry, index) => {
          const id = entry.id as string;
          const title = entry[config.titleKey];
          const subtitle = config.subtitleKey ? entry[config.subtitleKey] : undefined;

          return (
            <SortableItem key={id} id={id}>
              {(handle) => (
                <CollapsibleCard
                  open={section.isExpanded(id)}
                  onOpenChange={(open) => section.setExpanded(id, open)}
                  title={
                    isBlank(title as string)
                      ? `Untitled ${config.addLabel.replace(/^Add /, '')}`
                      : String(title)
                  }
                  subtitle={isBlank(subtitle as string) ? undefined : String(subtitle)}
                  actions={
                    <>
                      {handle}
                      <IconAction
                        label="Move up"
                        disabled={index === 0}
                        onClick={() => section.move(index, index - 1)}
                      >
                        <ChevronUp size={14} />
                      </IconAction>
                      <IconAction
                        label="Move down"
                        disabled={index === section.entries.length - 1}
                        onClick={() => section.move(index, index + 1)}
                      >
                        <ChevronDown size={14} />
                      </IconAction>
                      <IconAction label="Duplicate" onClick={() => section.duplicate(id)}>
                        <Copy size={13} />
                      </IconAction>
                      <IconAction label="Remove" danger onClick={() => section.remove(id)}>
                        <Trash2 size={13} />
                      </IconAction>
                    </>
                  }
                >
                  <div className="grid grid-cols-2 gap-3">
                    {config.fields.map((field) => (
                      <FieldRenderer
                        key={field.key}
                        field={field}
                        entry={entry}
                        hint={
                          field.kind === 'icon' && !section.template.icons
                            ? `${section.template.name} prints no icons, so this choice is kept but not drawn. Pick a design with an icon gutter to see it.`
                            : undefined
                        }
                        onChange={(fieldKey, value) => section.update(id, fieldKey, value)}
                      />
                    ))}
                  </div>
                </CollapsibleCard>
              )}
            </SortableItem>
          );
        })}
      </SortableList>

      {section.canAdd ? (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          leading={<Plus size={14} />}
          onClick={section.add}
        >
          {config.addLabel}
        </Button>
      ) : null}
    </div>
  );
};

interface IconActionProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}

const IconAction = ({ label, onClick, disabled, danger, children }: IconActionProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
    className={`text-fg-subtle hover:bg-surface-2 rounded p-1.5 transition disabled:opacity-30 ${
      danger ? 'hover:text-danger' : 'hover:text-fg'
    }`}
  >
    {children}
  </button>
);
