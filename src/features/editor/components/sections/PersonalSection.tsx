'use client';

import { Field, Input, Select } from '@/components/ui';
import { LIMITS, MARITAL_STATUSES } from '@/constants';
import { useResume } from '@/features/resume';
import { titleCase } from '@/lib/text';

import { useResumeEdit } from '../../hooks/useResumeEdit';

const MARITAL_OPTIONS = MARITAL_STATUSES.map((value) => ({ value, label: titleCase(value) }));

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
        Date of birth, gender, religion and marital status are expected on CVs in South Asia and the
        Gulf. For US, UK, Canadian and most EU applications, leave this section off — it invites
        discrimination screening and adds nothing.
      </p>

      <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
        {text('fatherName', "Father's name", undefined, LIMITS.nameChars)}
        {text('motherName', "Mother's name", undefined, LIMITS.nameChars)}
        {text('dateOfBirth', 'Date of birth', '01 January 1995', 20)}
        {text('gender', 'Gender', undefined, 30)}

        <Field label="Marital status">
          {({ id }) => (
            <Select
              id={id}
              options={MARITAL_OPTIONS}
              placeholder="Not specified"
              value={personal.maritalStatus}
              onChange={(event) =>
                patch('personal', {
                  maritalStatus: event.target.value as typeof personal.maritalStatus,
                })
              }
            />
          )}
        </Field>

        {text('nationality', 'Nationality', 'Bangladeshi')}
        {text('religion', 'Religion', undefined, 40)}
        {text('bloodGroup', 'Blood group', 'O+', 10)}
        {text('nationalId', 'National ID', undefined, 40)}
        {text('passportNumber', 'Passport number', undefined, 40)}
      </div>
    </div>
  );
};
