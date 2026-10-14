'use client';

import { Field, Input, Select } from '@/components/ui';
import { LIMITS, MARITAL_STATUSES } from '@/constants';
import { useResume } from '@/features/resume';

import { useResumeEdit } from '../../hooks/useResumeEdit';

const MARITAL_LABEL: Record<(typeof MARITAL_STATUSES)[number], string> = {
  single: 'অবিবাহিত',
  married: 'বিবাহিত',
  divorced: 'বিবাহবিচ্ছিন্ন',
  widowed: 'স্বামী/স্ত্রী মৃত',
};

const MARITAL_OPTIONS = MARITAL_STATUSES.map((value) => ({ value, label: MARITAL_LABEL[value] }));

/**
 * Civil details.
 *
 * Expected on South Asian and public-sector CVs, and grounds for rejection on
 * many Western ones — so the section is off by default and the warning stays
 * visible while it is on.
 */
export const PersonalSection = () => {
  const { personal } = useResume();
  const { patch } = useResumeEdit();

  const text = (key: keyof typeof personal, label: string, placeholder?: string, max = 60) => (
    <Field key={key} label={label}>
      {({ id }) => (
        <Input
          id={id}
          value={personal[key]}
          maxLength={max}
          placeholder={placeholder}
          onChange={(event) => patch('personal', { [key]: event.target.value })}
        />
      )}
    </Field>
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-control bg-warning/10 text-ui-xs text-warning px-3 py-2 leading-relaxed">
        দক্ষিণ এশিয়া ও উপসাগরীয় দেশের CV-তে জন্মতারিখ, লিঙ্গ, ধর্ম ও বৈবাহিক অবস্থা আশা করা হয়।
        যুক্তরাষ্ট্র, যুক্তরাজ্য, কানাডা ও বেশির ভাগ ইউরোপীয় আবেদনে এই সেকশন বন্ধ রাখুন — এতে বৈষম্যমূলক
        বাছাইয়ের ঝুঁকি থাকে, আর কোনো লাভ নেই।
      </p>

      <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
        {text('fatherName', "বাবার নাম", undefined, LIMITS.nameChars)}
        {text('motherName', "মায়ের নাম", undefined, LIMITS.nameChars)}
        {text('dateOfBirth', 'জন্মতারিখ', '০১ জানুয়ারি ১৯৯৫', 20)}
        {text('gender', 'লিঙ্গ', undefined, 30)}

        <Field label="বৈবাহিক অবস্থা">
          {({ id }) => (
            <Select
              id={id}
              options={MARITAL_OPTIONS}
              placeholder="উল্লেখ করা নেই"
              value={personal.maritalStatus}
              onChange={(event) =>
                patch('personal', {
                  maritalStatus: event.target.value as typeof personal.maritalStatus,
                })
              }
            />
          )}
        </Field>

        {text('nationality', 'জাতীয়তা', 'বাংলাদেশি')}
        {text('religion', 'ধর্ম', undefined, 40)}
        {text('bloodGroup', 'রক্তের গ্রুপ', 'O+', 10)}
        {text('nationalId', 'জাতীয় পরিচয়পত্র নম্বর', undefined, 40)}
        {text('passportNumber', 'পাসপোর্ট নম্বর', undefined, 40)}
      </div>
    </div>
  );
};
