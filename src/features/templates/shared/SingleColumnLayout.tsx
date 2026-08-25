import {
  getSectionHeading,
  getVisibleSections,
  isSectionVisible,
  type Resume,
} from '@/features/resume';
import { isBlank } from '@/lib/text';

import { ContactRow } from './ContactRow';
import { PhotoFrame } from './PhotoFrame';
import { ResumeDocument } from './ResumeDocument';
import { SectionBody } from './SectionBody';
import { SignatureBlock } from './blocks/ClosingBlocks';
import type { TemplateMeta } from '../types';
import { shouldShowPhoto } from '../utils/theme';

export interface SingleColumnLayoutProps {
  resume: Resume;
  meta: TemplateMeta;
  print?: boolean;
  /** Namespace class for the template's own stylesheet. */
  templateClass: string;
  /** Class applied to every section heading, e.g. `atp-heading`. */
  headingClass: string;
  withContactIcons?: boolean;
}

/**
 * The shared skeleton behind the single-column designs.
 *
 * They differ in typography and rules, not in structure, so they share one
 * implementation — which also means they cannot drift apart in reading order,
 * the thing the regression gate actually checks.
 */
export const SingleColumnLayout = ({
  resume,
  meta,
  print,
  templateClass,
  headingClass,
  withContactIcons = true,
}: SingleColumnLayoutProps) => {
  const sections = getVisibleSections(resume);
  const showPhoto = shouldShowPhoto(resume.meta.theme, meta, resume.basics.photo);

  return (
    <ResumeDocument resume={resume} meta={meta} print={print} templateClass={templateClass}>
      <header className={`${templateClass}-identity`}>
        {showPhoto ? (
          <PhotoFrame
            src={resume.basics.photo}
            frame={resume.basics.photoFrame}
            className={`${templateClass}-identity__photo`}
          />
        ) : null}

        <div>
          {!isBlank(resume.basics.fullName) ? (
            <h1 className={`${templateClass}-name`}>{resume.basics.fullName}</h1>
          ) : null}
          {!isBlank(resume.basics.headline) ? (
            <p className={`${templateClass}-headline`}>{resume.basics.headline}</p>
          ) : null}
          <ContactRow contact={resume.contact} withIcons={withContactIcons} />
        </div>
      </header>

      {sections.map((key) => (
        <section key={key} className="rz-section">
          <h2 className={`${headingClass} rz-heading`}>{getSectionHeading(resume, key)}</h2>
          <SectionBody
            resume={resume}
            sectionKey={key}
            showIcons={meta.supports.icons}
            entryMarkers={meta.supports.entryMarkers}
          />
        </section>
      ))}

      {isSectionVisible(resume, 'signature') ? <SignatureBlock resume={resume} /> : null}
    </ResumeDocument>
  );
};
