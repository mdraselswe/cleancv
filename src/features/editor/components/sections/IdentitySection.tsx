'use client';

import { Plus, Trash2 } from 'lucide-react';

import { Button, Field, ImageUpload, Input, SectionLabel } from '@/components/ui';
import { IMAGE_BUDGET, LIMITS, PHOTO_FRAME } from '@/constants';
import { useResume, useResumeActions } from '@/features/resume';
import { createCustomLink } from '@/features/resume';

import { PhotoFramer } from '../PhotoFramer';
import { useResumeEdit } from '../../hooks/useResumeEdit';

const DEFAULT_PHOTO_FRAME = {
  x: PHOTO_FRAME.position.default,
  y: PHOTO_FRAME.position.default,
  zoom: PHOTO_FRAME.zoom.default,
};

/**
 * Name, title, photo and every way to reach you.
 *
 * Contact detail is the one thing a parser must not lose, so these fields are
 * always present regardless of which sections the user has switched on.
 */
export const IdentitySection = () => {
  const resume = useResume();
  const actions = useResumeActions();
  const { patch } = useResumeEdit();
  const { basics, contact } = resume;

  const setLink = (id: string, changes: { label?: string; url?: string }) =>
    actions.edit((draft) => {
      draft.contact.links = draft.contact.links.map((link) =>
        link.id === id ? { ...link, ...changes } : link,
      );
    }, `link:${id}`);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
        <Field label="পুরো নাম" className="col-span-full">
          {({ id }) => (
            <Input
              id={id}
              value={basics.fullName}
              maxLength={LIMITS.nameChars}
              placeholder="Muhammad Rasel"
              onChange={(event) => patch('basics', { fullName: event.target.value })}
            />
          )}
        </Field>

        <Field
          label="পেশার শিরোনাম"
          className="col-span-full"
          hint="যে পদের জন্য আবেদন করছেন সেটি লিখুন, বর্তমান পদটি নয়।"
        >
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              value={basics.headline}
              maxLength={LIMITS.headlineChars}
              placeholder="Senior Software Engineer | Next.js Expert"
              onChange={(event) => patch('basics', { headline: event.target.value })}
            />
          )}
        </Field>
      </div>

      <ImageUpload
        label="ছবি"
        value={basics.photo}
        budget={IMAGE_BUDGET}
        hint="না দিলেও চলে, আর ছবি থাকলে ATS সফটওয়্যারের পড়তে সমস্যা হতে পারে। যুক্তরাষ্ট্র, যুক্তরাজ্য ও কানাডার আবেদনে ছবি দেবেন না।"
        onChange={(photo) => {
          // A new photo is a new subject: the old framing described someone
          // else's head, so it goes back to centre. See ADR-025.
          patch('basics', { photo, photoFrame: DEFAULT_PHOTO_FRAME });
          // Uploading a photo and seeing nothing change is the obvious trap here;
          // templates that cannot print one ignore the flag anyway.
          actions.setTheme({ showPhoto: photo.length > 0 });
        }}
      />

      {basics.photo ? (
        <PhotoFramer
          photo={basics.photo}
          frame={basics.photoFrame}
          onChange={(photoFrame) => patch('basics', { photoFrame })}
        />
      ) : null}

      <div>
        <SectionLabel className="mb-2.5">যোগাযোগ</SectionLabel>
        <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
          <Field label="ফোন">
            {({ id }) => (
              <Input
                id={id}
                type="tel"
                value={contact.phone}
                placeholder="+8801781182143"
                onChange={(event) => patch('contact', { phone: event.target.value })}
              />
            )}
          </Field>

          <Field label="বিকল্প ফোন">
            {({ id }) => (
              <Input
                id={id}
                type="tel"
                value={contact.altPhone}
                onChange={(event) => patch('contact', { altPhone: event.target.value })}
              />
            )}
          </Field>

          <Field label="ইমেইল" className="col-span-full">
            {({ id }) => (
              <Input
                id={id}
                type="email"
                value={contact.email}
                placeholder="you@example.com"
                onChange={(event) => patch('contact', { email: event.target.value })}
              />
            )}
          </Field>

          <Field label="অবস্থান" className="col-span-full" hint="শহর আর দেশের নাম দিলেই যথেষ্ট।">
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                value={contact.location}
                placeholder="Dhaka, Bangladesh"
                onChange={(event) => patch('contact', { location: event.target.value })}
              />
            )}
          </Field>

          <Field label="LinkedIn">
            {({ id }) => (
              <Input
                id={id}
                type="url"
                value={contact.linkedin}
                placeholder="linkedin.com/in/…"
                onChange={(event) => patch('contact', { linkedin: event.target.value })}
              />
            )}
          </Field>

          <Field label="GitHub">
            {({ id }) => (
              <Input
                id={id}
                type="url"
                value={contact.github}
                placeholder="github.com/…"
                onChange={(event) => patch('contact', { github: event.target.value })}
              />
            )}
          </Field>

          <Field label="পোর্টফোলিও" className="col-span-full">
            {({ id }) => (
              <Input
                id={id}
                type="url"
                value={contact.portfolio}
                placeholder="yourname.dev"
                onChange={(event) => patch('contact', { portfolio: event.target.value })}
              />
            )}
          </Field>

          <Field label="বর্তমান ঠিকানা" className="col-span-full">
            {({ id }) => (
              <Input
                id={id}
                value={contact.presentAddress}
                onChange={(event) => patch('contact', { presentAddress: event.target.value })}
              />
            )}
          </Field>

          <Field label="স্থায়ী ঠিকানা" className="col-span-full">
            {({ id }) => (
              <Input
                id={id}
                value={contact.permanentAddress}
                onChange={(event) => patch('contact', { permanentAddress: event.target.value })}
              />
            )}
          </Field>
        </div>
      </div>

      <div>
        <SectionLabel className="mb-2.5">অন্যান্য লিংক</SectionLabel>
        <div className="flex flex-col gap-2">
          {contact.links.map((link) => (
            <div key={link.id} className="flex gap-2">
              <Input
                value={link.label}
                placeholder="লেবেল"
                className="w-40"
                onChange={(event) => setLink(link.id, { label: event.target.value })}
              />
              <Input
                value={link.url}
                type="url"
                placeholder="https://…"
                onChange={(event) => setLink(link.id, { url: event.target.value })}
              />
              <button
                type="button"
                aria-label="লিংক সরান"
                onClick={() =>
                  actions.edit((draft) => {
                    draft.contact.links = draft.contact.links.filter((item) => item.id !== link.id);
                  })
                }
                className="text-fg-subtle hover:bg-surface-2 hover:text-danger rounded-lg p-2 transition"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {contact.links.length < LIMITS.customLinks ? (
            <Button
              size="sm"
              variant="ghost"
              className="self-start"
              leading={<Plus size={14} />}
              onClick={() =>
                actions.edit((draft) => {
                  draft.contact.links.push(createCustomLink());
                })
              }
            >
              লিংক যোগ করুন
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
