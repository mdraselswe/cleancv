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
    <Modal label="CV-এর নাম বদলান" onClose={onClose} className="max-w-[420px]">
      <ModalHeader title="CV-এর নাম বদলান" subtitle="এই নামটি শুধু আপনি দেখতে পাবেন।" onClose={onClose} />
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
          aria-label="CV-এর নাম"
          onChange={(event) => setName(event.target.value)}
          onFocus={(event) => event.target.select()}
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            বাতিল
          </Button>
          <Button variant="primary" type="submit">
            নাম সংরক্ষণ করুন
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
  <Modal label="CV মুছে ফেলুন" onClose={onClose} className="max-w-[420px]">
    <ModalHeader title="এই CV মুছে ফেলবেন?" onClose={onClose} />
    <div className="flex flex-col gap-4 p-4">
      <p className="text-fg-muted text-ui-md leading-relaxed">
        <strong className="text-fg">{title}</strong> এই ব্রাউজার থেকে মুছে যাবে। পরে ফিরে পেতে
        চাইলে আগে একটি ব্যাকআপ ডাউনলোড করে নিন।
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          রেখে দিন
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          মুছে ফেলুন
        </Button>
      </div>
    </div>
  </Modal>
);
