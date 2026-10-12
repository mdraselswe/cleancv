'use client';

import { useState } from 'react';

import { Button, Input, Modal, ModalHeader } from '@/components/ui';
import type { DocumentMeta } from '@/features/library';

export interface RenameDialogProps {
  document: DocumentMeta;
  fallbackName: string;
  onConfirm: (name: string) => void;
  onClose: () => void;
}

export const RenameDialog = ({ document, fallbackName, onConfirm, onClose }: RenameDialogProps) => {
  const [name, setName] = useState(document.name || fallbackName);

  return (
    <Modal label="Rename CV" onClose={onClose} className="max-w-[420px]">
      <ModalHeader title="Rename CV" subtitle="Only you see this name." onClose={onClose} />
      <form
        className="flex flex-col gap-4 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm(name);
        }}
      >
        <Input
          autoFocus
          value={name}
          maxLength={120}
          aria-label="CV name"
          onChange={(event) => setName(event.target.value)}
          onFocus={(event) => event.target.select()}
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Save name
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export interface DeleteDialogProps {
  title: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteDialog = ({ title, onConfirm, onClose }: DeleteDialogProps) => (
  <Modal label="Delete CV" onClose={onClose} className="max-w-[420px]">
    <ModalHeader title="Delete this CV?" onClose={onClose} />
    <div className="flex flex-col gap-4 p-4">
      <p className="text-fg-muted text-ui-md leading-relaxed">
        <strong className="text-fg">{title}</strong> will be removed from this browser. Download a
        backup first if you might want it back.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Keep it
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Delete
        </Button>
      </div>
    </div>
  </Modal>
);
