'use client';

import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, MoreVertical, Plus, Trash2 } from 'lucide-react';

import {
  Button,
  CollapsibleCard,
  EmptyState,
  Menu,
  SortableItem,
  SortableList,
} from '@/components/ui';
import type { EntryListKey } from '@/features/resume';
import { bn } from '@/lib/bn';
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
                      ? `নামহীন ${config.noun}`
                      : String(title)
                  }
                  subtitle={
                    section.isHidden(id)
                      ? `আপনার CV থেকে লুকানো${isBlank(subtitle as string) ? '' : ` · ${String(subtitle)}`}`
                      : isBlank(subtitle as string)
                        ? undefined
                        : String(subtitle)
                  }
                  actions={
                    <>
                      {handle}
                      {/*
                        One menu rather than four glyphs. Four of them packed
                        a hundred and twenty pixels on a phone — under the
                        forty-four a thumb needs, and unlabelled, so the only
                        way to learn which was "duplicate" and which was
                        "delete" was to press one. See ADR-047.
                      */}
                      <Menu
                        label={`${config.noun} ${bn(index + 1)}-এর অ্যাকশন`}
                        entries={[
                          {
                            id: 'up',
                            label: 'ওপরে সরান',
                            icon: <ArrowUp size={15} />,
                            disabled: index === 0,
                            onSelect: () => section.move(index, index - 1),
                          },
                          {
                            id: 'down',
                            label: 'নিচে সরান',
                            icon: <ArrowDown size={15} />,
                            disabled: index === section.entries.length - 1,
                            onSelect: () => section.move(index, index + 1),
                          },
                          {
                            id: 'duplicate',
                            label: 'কপি করুন',
                            icon: <Copy size={15} />,
                            onSelect: () => section.duplicate(id),
                          },
                          {
                            id: 'hide',
                            label: section.isHidden(id) ? 'CV-তে দেখান' : 'CV থেকে লুকান',
                            icon: section.isHidden(id) ? <Eye size={15} /> : <EyeOff size={15} />,
                            onSelect: () => section.setHidden(id, !section.isHidden(id)),
                          },
                          { id: 'sep', separator: true },
                          {
                            id: 'remove',
                            label: 'মুছে ফেলুন',
                            icon: <Trash2 size={15} />,
                            danger: true,
                            onSelect: () => section.remove(id),
                          },
                        ]}
                        trigger={(props) => (
                          <Button size="icon" variant="ghost" aria-label="এন্ট্রির কাজ" {...props}>
                            <MoreVertical size={16} />
                          </Button>
                        )}
                      />
                    </>
                  }
                >
                  <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
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
        <button
          type="button"
          onClick={section.add}
          className="tap-target border-primary/30 text-primary hover:bg-primary-soft hover:border-primary/60 rounded-card text-ui-md flex w-full items-center justify-center gap-2 border-2 border-dashed px-4 py-3 font-semibold transition active:scale-[0.99]"
        >
          <Plus size={16} />
          {config.addLabel}
        </button>
      ) : null}
    </div>
  );
};
