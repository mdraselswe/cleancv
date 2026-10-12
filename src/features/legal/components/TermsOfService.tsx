import Link from 'next/link';

import {
  APP_NAME,
  LEGAL_CONTACT_EMAIL,
  LEGAL_ENTITY,
  LEGAL_ROUTES,
  PASSWORD_MIN,
} from '@/constants';

import { LegalList, LegalSection, LegalShell } from './LegalShell';

/**
 * The rules for using the service.
 *
 * Deliberately short and specific. A terms page nobody can finish is a terms
 * page nobody has agreed to in any sense that matters, and the actual rules
 * here fit on a page: keep your CV backed up, do not attack the service, we
 * make no promise about whether a given employer's parser likes the output.
 */
const Mail = () => (
  <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-fg underline">
    {LEGAL_CONTACT_EMAIL}
  </a>
);

export interface TermsOfServiceProps {
  /** Whether email-and-password accounts are on; the terms state only what is true. */
  emailAuth: boolean;
}

export const TermsOfService = ({ emailAuth }: TermsOfServiceProps) => (
  <LegalShell
    title="Terms of Service"
    summary={`The rules for using ${APP_NAME}. Using the service means you accept them.`}
  >
    <LegalSection id="service" heading="What the service is">
      <p>
        {APP_NAME} is a tool for writing a CV and exporting it as a PDF, run by {LEGAL_ENTITY}. The
        document you write is stored by your browser and, if you sign in, synced to your account;
        the service renders it into a PDF when you ask for one. Details are in the{' '}
        <Link href={LEGAL_ROUTES.privacy} className="text-fg underline">
          Privacy Policy
        </Link>
        .
      </p>
      <p>It is free to use. There is no charge, no subscription, and nothing to pay for.</p>
    </LegalSection>

    <LegalSection id="account" heading="Your account">
      <p>
        A free account is required to download a PDF, and it adds cross-device sync. Editing and
        everything else works without one.
      </p>
      <LegalList
        items={[
          ...(emailAuth
            ? [
                'Use a real email address you control. You will be asked to confirm it before the account works, and it is the only way back in if you forget your password.',
                `Choose a password of at least ${PASSWORD_MIN} characters, and do not reuse one from somewhere else.`,
              ]
            : ['Sign in with a Google account you control. There is no separate password.']),
          'Keep it to yourself. Anything done from your account is treated as done by you.',
          'One account per person. Do not create one under somebody else’s name or address.',
        ]}
      />
      <p>
        Tell us at <Mail /> if you think somebody else has got into your account. {emailAuth
          ? 'Resetting your password signs every other browser out, which is usually the fastest fix.'
          : 'Signing out of Google on a shared device is the fastest fix.'}
      </p>
    </LegalSection>

    <LegalSection id="your-content" heading="What you write stays yours">
      <p>
        Your CV is your work and your property. We claim no rights over it, no licence to it, and no
        ownership of anything you write, import or export. Signed-in CVs are stored only to provide
        the sync feature you requested.
      </p>
      <p>
        You are responsible for what it says. Do not put someone else&apos;s personal details in it
        without their agreement, and do not claim qualifications or employment you do not have —
        that is between you and the employer reading it, but it is not something this tool will help
        you do.
      </p>
    </LegalSection>

    <LegalSection id="acceptable-use" heading="What you may not do">
      <LegalList
        items={[
          'Attack the service — probing, overloading, or trying to reach parts of it that are not yours.',
          'Use it to send bulk or automated requests. The PDF renderer is a real browser and a single request is expensive; script it and you will be rate-limited or blocked.',
          'Use somebody else’s account, or create accounts to get around a block.',
          'Use it to produce documents intended to defraud or impersonate.',
        ]}
      />
      <p>
        An account doing any of these can be suspended or removed without notice. In practice this
        section exists so there is something to point at; it is not aimed at anyone using the tool
        to write a CV.
      </p>
    </LegalSection>

    <LegalSection id="ats" heading="What we do not promise">
      <p>
        Every design here is built and tested so its PDF carries a real, correctly ordered text
        layer, and the ATS score tells you what a parser is likely to make of your document. That is
        a well-founded estimate, not a guarantee. Applicant tracking systems differ, employers
        configure them differently, and none of them publishes how it reads a file.{' '}
        <strong className="text-fg font-semibold">
          We cannot promise any particular employer&apos;s system will parse your CV, and a good
          score is not a promise of an interview.
        </strong>
      </p>
      <p>
        The service is provided as it is, with no warranty. It may be unavailable, it may change,
        and features may be removed. To the extent the law allows, {LEGAL_ENTITY} is not liable for
        any loss arising from using it — including a lost document, a missed deadline, or an
        application that was not read.
      </p>
    </LegalSection>

    <LegalSection id="backups" heading="Keep your own copy">
      <p>
        Local copies can still be lost when browser data is cleared. Cloud sync protects signed-in
        CVs across devices, but it is not a substitute for a backup and the service has no uptime or
        permanent-storage guarantee.
      </p>
      <p>
        Download a JSON backup, or point the app at a workspace folder that a sync service already
        watches. Every PDF you export also carries the document inside it and can be imported back —
        so a downloaded PDF is itself a backup.
      </p>
    </LegalSection>

    <LegalSection id="ending" heading="Ending it">
      <p>
        You can stop using the service at any time, and ask us at <Mail /> to delete your account.
        We may close an account that breaks these terms. Account deletion also removes its cloud CV
        copies; local copies already stored in your browsers remain under your control.
      </p>
    </LegalSection>

    <LegalSection id="changes" heading="Changes">
      <p>
        These terms may change; the date at the top says when they last did. Continuing to use the
        service after a change means accepting it. A change that materially affects account holders
        will be emailed to the address on the account.
      </p>
    </LegalSection>

    <LegalSection id="contact" heading="Contact">
      <p>
        Anything at all: <Mail />.
      </p>
    </LegalSection>
  </LegalShell>
);
