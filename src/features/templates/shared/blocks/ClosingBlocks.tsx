import { MARITAL_STATUSES, ON_REQUEST_TEXT } from '@/constants';
import type { Resume } from '@/features/resume';
import { formatToday } from '@/lib/date';
import { isBlank, joinNonEmpty, titleCase } from '@/lib/text';

import { CategoryIcon } from '../CategoryIcon';
import type { BlockProps } from './HistoryBlocks';

/** The blocks that close a document: civil details, interests, referees, sign-off. */

interface DetailRow {
  label: string;
  value: string;
}

export const PersonalInfoBlock = ({ resume }: BlockProps) => {
  const { personal, contact } = resume;

  const rows: DetailRow[] = [
    { label: "Father's Name", value: personal.fatherName },
    { label: "Mother's Name", value: personal.motherName },
    { label: 'Date of Birth', value: personal.dateOfBirth },
    { label: 'Gender', value: personal.gender },
    { label: 'Marital Status', value: formatMaritalStatus(personal.maritalStatus) },
    { label: 'Nationality', value: personal.nationality },
    { label: 'Religion', value: personal.religion },
    { label: 'Blood Group', value: personal.bloodGroup },
    { label: 'National ID', value: personal.nationalId },
    { label: 'Passport No.', value: personal.passportNumber },
    { label: 'Present Address', value: contact.presentAddress },
    { label: 'Permanent Address', value: contact.permanentAddress },
  ].filter((row) => !isBlank(row.value));

  if (rows.length === 0) return null;

  return (
    <dl className="rz-details">
      {rows.map((row) => (
        <div key={row.label} className="rz-details__row">
          <dt className="rz-details__label">{row.label}</dt>
          <dd className="rz-details__value">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
};

const formatMaritalStatus = (value: string): string =>
  (MARITAL_STATUSES as readonly string[]).includes(value) ? titleCase(value) : value;

export const InterestsBlock = ({ resume }: BlockProps) => (
  <p className="rz-inline-list">{resume.interests.items.join(', ')}</p>
);

export const ReferencesBlock = ({ resume, entryIcon }: BlockProps) => {
  if (resume.references.mode === 'on-request') {
    return <p className="rz-inline-list">{ON_REQUEST_TEXT}</p>;
  }

  return (
    <div className="rz-grid-2">
      {resume.references.entries.map((entry) => (
        <div
          key={entry.id}
          className={
            entryIcon ? 'rz-entry rz-avoid-break rz-entry--marked' : 'rz-entry rz-avoid-break'
          }
        >
          {entry.name ? (
            <h3 className="rz-entry__title">
              {entryIcon ? <CategoryIcon label="" icon={entryIcon} fallback={entryIcon} /> : null}
              {entry.name}
            </h3>
          ) : null}
          <p className="rz-entry__org">
            {joinNonEmpty([entry.designation, entry.organization], ', ')}
          </p>
          <p className="rz-entry__meta rz-entry__meta--inline">
            {joinNonEmpty([entry.email, entry.phone, entry.relationship])}
          </p>
        </div>
      ))}
    </div>
  );
};

export const DeclarationBlock = ({ resume }: BlockProps) => {
  const { declaration } = resume;
  // Blank date with the stamp on means "whatever today is when this was made".
  const date = declaration.showDate ? declaration.date || formatToday() : '';
  const stamp = joinNonEmpty([declaration.place, date], ', ');

  return (
    <div className="rz-declaration rz-avoid-break">
      <p>{declaration.text}</p>
      {stamp ? <p className="rz-declaration__stamp rz-muted">{stamp}</p> : null}
    </div>
  );
};

export interface SignatureBlockProps {
  resume: Resume;
}

/**
 * Rendered last and outside the section order — a signature belongs at the foot
 * of the document regardless of how the sections above are arranged.
 */
export const SignatureBlock = ({ resume }: SignatureBlockProps) => {
  const { signature, basics } = resume;
  const name = isBlank(signature.typedName) ? basics.fullName : signature.typedName;

  return (
    <div className="rz-signature rz-avoid-break">
      {signature.mode === 'image' && signature.image ? (
        // A data URL of unknown dimensions; next/image would add nothing.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={signature.image} alt="" className="rz-signature__image" />
      ) : (
        <span className="rz-signature__typed">{name}</span>
      )}
      <span className="rz-signature__rule" aria-hidden="true" />
      <span className="rz-signature__caption rz-muted">
        {isBlank(signature.caption) ? name : signature.caption}
      </span>
    </div>
  );
};
