import Link from 'next/link';

import {
  ACCOUNT_DELETION_DAYS,
  APP_NAME,
  CLOUD_SYNC,
  LEGAL_CONTACT_EMAIL,
  LEGAL_ENTITY,
  LEGAL_ROUTES,
} from '@/constants';

import { LegalList, LegalSection, LegalShell } from './LegalShell';

/**
 * What the service does with data, written from what the code actually does.
 *
 * Every claim here is checkable against a file: the CV is in IndexedDB because
 * `features/library` puts it there, the export transits the server because
 * `/api/pdf` renders it in headless Chrome, and the session row holds an IP
 * address because Better Auth's schema has that column. A policy that promises
 * more than the code does is the kind that gets found out.
 */
const Mail = () => (
  <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-fg underline">
    {LEGAL_CONTACT_EMAIL}
  </a>
);

export interface PrivacyPolicyEnProps {
  /** Whether email-and-password accounts are on; the policy states only what is true. */
  emailAuth: boolean;
  /** Whether AI polish exists on this deployment. */
  ai?: boolean;
}

export const PrivacyPolicyEn = ({ emailAuth, ai = false }: PrivacyPolicyEnProps) => (
  <LegalShell
    title="Privacy Policy"
    summary={`How ${APP_NAME} handles your CV, optional cloud sync, and your account.`}
  >
    <LegalSection id="short-version" heading="The short version">
      <LegalList
        items={[
          <>
            <strong className="text-fg font-semibold">Your CV is local-first.</strong> Every CV is
            saved in your browser, on your device.
          </>,
          <>
            <strong className="text-fg font-semibold">
              Up to {CLOUD_SYNC.maxDocuments} CVs, the ones you choose, can also be kept on your
              account
            </strong>{' '}
            so they follow you to other devices. Nothing is uploaded unless you switch a CV to
            sync. Every other CV stays on your device only.
          </>,
          <>
            <strong className="text-fg font-semibold">
              Anonymous usage analytics, never advertising profiles.
            </strong>{' '}
            Visits are counted in aggregate and are not connected to your CV or account identity.
          </>,
          <>
            <strong className="text-fg font-semibold">
              Downloading a PDF sends your CV through our server
            </strong>{' '}
            to be rendered, and it is discarded as soon as the file is sent back.
          </>,
        ]}
      />
    </LegalSection>

    <LegalSection id="analytics" heading="Anonymous usage analytics">
      <p>
        Vercel Web Analytics counts page views and approximate unique visitors so we can understand
        whether the service is useful. It may report the page, referrer, country, device type,
        operating system and browser. The analytics record is anonymous, uses no tracking cookie,
        does not retain an IP address, and is not joined to a CleanCV account or CV.
      </p>
      <p>
        When the editor is opened while signed out, CleanCV also stores a random browser ID in local
        storage. Only a one-way hash of that ID, first and last activity times, and a visit count are
        stored. It is not based on an IP address, device fingerprint, name, email, or CV content.
      </p>
      <p>
        Signed-in account activity shown to the service owner is limited to account details already
        listed below, the number of synced CVs, and timestamps from sessions and sync writes. The
        dashboard does not expose CV content.
      </p>
    </LegalSection>

    <LegalSection id="who-we-are" heading="Who this is">
      <p>
        {APP_NAME} is run by {LEGAL_ENTITY}. Questions, requests and complaints go to <Mail />.
      </p>
    </LegalSection>

    <LegalSection id="your-cv" heading="Your CV is local-first">
      <p>
        Everything you type into the editor — your name, contact details, photograph, employment
        history, every bullet — is stored by your browser on your own device, in IndexedDB. It is
        saved as you type and remains usable offline. Signed-out CVs are not stored in our database,
        so clearing browsing data can erase the only copy unless you made a backup.
      </p>
      <p>
        If you point the app at a workspace folder, it also writes copies of your documents into
        that folder. That folder is on your own disk (or in whatever service you have syncing it),
        and the app has no access to anything outside the folder you chose.
      </p>
      <p>
        Photographs and signatures you upload are converted to data URLs and stored the same way —
        in your browser, alongside the rest of the document.
      </p>
      <p>
        Signing in does not upload anything by itself. A CV is copied to our database only after
        you switch it to <em>sync to my account</em>, and an account can keep at most{' '}
        {CLOUD_SYNC.maxDocuments} such CVs, each up to {CLOUD_SYNC.maxBytes / 1024} KB including
        its photograph or signature. Those copies are merged across your signed-in devices; the
        newest saved copy wins. Stopping sync removes the server copy and leaves the CV on your
        device. Deleting a synced CV leaves a small marker so an old offline device cannot restore
        it.
      </p>
    </LegalSection>

    <LegalSection id="account" heading="What an account stores">
      <p>
        A free account is required to download a PDF, and it lets you keep up to{' '}
        {CLOUD_SYNC.maxDocuments} CVs of your choice on the server. Writing, designs, ATS scoring,
        imports, backups and the document library work without an account.
      </p>
      <p>When you create an account, our database holds:</p>
      <LegalList
        items={[
          emailAuth
            ? 'Your name and email address, as you entered them.'
            : 'Your name and email address, as Google reports them.',
          ...(emailAuth
            ? [
                'A scrypt hash of your password. The password itself is never stored and cannot be recovered from the hash — that is why a forgotten password is reset rather than looked up.',
              ]
            : []),
          'If you signed in with Google: the account identifier Google gives us, and the tokens Google issues for it. We ask Google for your name, email address and profile picture, and nothing else.',
          'One row per active session, holding a session token, the IP address and browser user-agent it was created from, and when it expires. This is what lets you stay signed in, and what makes it possible to sign every other browser out when you reset your password.',
          ...(emailAuth
            ? [
                'Short-lived tokens for confirming your email address and resetting your password. Each is deleted once it is used, and expires within an hour either way.',
              ]
            : []),
          'Counters keyed by IP address, used to rate-limit sign-in attempts.',
          `The CVs you chose to sync (at most ${CLOUD_SYNC.maxDocuments}), their names and timestamps, and deletion markers for CVs removed on another device.`,
        ]}
      />
    </LegalSection>

    <LegalSection id="transit" heading="When your CV does reach our server">
      <p>
        Cloud sync, PDF export, and optional smart import send document content off your device.
        Sync applies only to a CV you switched on, after you sign in; the other two start only
        when you request them.
      </p>
      <p>
        <strong className="text-fg font-semibold">Downloading a PDF.</strong> The PDF is rendered by
        a real browser so it carries a genuine text layer rather than a picture of one, and that
        rendering happens on our server. Your document is sent there, laid out, turned into a PDF,
        and returned to you. It is held in memory for the seconds that takes and is not written to a
        disk or a database. If the render fails, the error is logged; the document is not.
      </p>
      <p>
        <strong className="text-fg font-semibold">Smart import.</strong> If you configure an AI
        endpoint of your own to help parse a CV you are importing, the text of that CV is forwarded
        to the endpoint you named, using the API key you supplied. Our server is a pass-through
        here: it stores nothing and logs nothing, and it exists only because a browser cannot make
        that request directly. What the provider you chose does with the text is governed by their
        policy, not ours. This feature is off unless you turn it on.
      </p>
      <p>
        Note that an exported PDF has your CV data embedded inside it as an attachment, so that
        opening the file in {APP_NAME} later restores the document exactly. That is a feature of the
        file you downloaded — if you send that PDF to someone, the data goes with it.
      </p>
    </LegalSection>

    <LegalSection id="cookies" heading="Cookies">
      <p>
        One cookie, and only once you sign in: the session cookie that keeps you signed in. It is
        signed, marked <code className="font-mono">HttpOnly</code> and{' '}
        <code className="font-mono">SameSite</code>, and served over HTTPS only.
      </p>
      <p>
        There are no advertising cookies, analytics cookies or cross-site trackers on this site.
        Anonymous analytics are cookie-free. Your theme choice and a few
        interface preferences are kept in your browser&apos;s local storage, which is not a cookie
        and never leaves your device.
      </p>
    </LegalSection>

    <LegalSection id="processors" heading="Who else touches this data">
      <p>{3 + (emailAuth ? 1 : 0) + (ai ? 1 : 0)} services, each doing one job:</p>
      <LegalList
        items={[
          <>
            <strong className="text-fg font-semibold">Vercel</strong> hosts the site, keeps request
            logs, and provides anonymous aggregate Web Analytics.
          </>,
          <>
            <strong className="text-fg font-semibold">Neon</strong> hosts the database that holds
            accounts, sessions and signed-in users&apos; synced CVs.
          </>,
          ...(emailAuth
            ? [
                <>
                  <strong className="text-fg font-semibold">Resend</strong> sends the two emails
                  this service sends: confirm your address, and reset your password. It receives
                  your email address in order to deliver them.
                </>,
              ]
            : []),
          <>
            <strong className="text-fg font-semibold">Google</strong>, if and only if you choose to
            sign in with Google.
          </>,
          ...(ai
            ? [
                <>
                  <strong className="text-fg font-semibold">Google Gemini</strong> rewrites a bullet
                  or summary when an account on a short invitation list presses{' '}
                  <em>Polish with AI</em>. Only that text — and the job description, if you pasted
                  one — is sent, from the server, never from the browser. It is not available to
                  other accounts.
                </>,
              ]
            : []),
        ]}
      />
      <p>
        Vercel receives CV content briefly when rendering a PDF, and Neon stores synced CVs for
        signed-in users.{' '}
        {ai
          ? 'Google Gemini receives only the text being rewritten, and only for accounts allowed to use AI polish. '
          : ''}
        {emailAuth ? 'Resend is sent your email address and no CV content. ' : ''}
        Google sign-in is sent no CV content. We do not sell personal data.
      </p>
    </LegalSection>

    <LegalSection id="retention" heading="How long it is kept">
      <p>
        Account data is kept while the account exists. Ask us to delete it and everything above is
        removed within {ACCOUNT_DELETION_DAYS} days, sessions included. Expired sessions and used
        tokens are deleted as they expire, without being asked.
      </p>
      <p>
        Server copies of CVs are removed for an account that has been inactive for{' '}
        {CLOUD_SYNC.inactiveMonths} months, at our discretion and without a notice. The account
        itself, and every CV in your own browsers, are not affected, and you can switch a CV back
        to sync at any time.
      </p>
      <p>
        Your CV is kept for exactly as long as you keep it, because it is on your machine. Deleting
        your account does not touch it.
      </p>
    </LegalSection>

    <LegalSection id="rights" heading="Your choices">
      <p>
        You can ask for a copy of what we hold about you, ask us to correct it, or ask us to delete
        it and the account with it. Write to <Mail /> from the address on the account and we will
        act on it.
      </p>
      <p>
        You can also empty everything on your own side at any time: the document library has a
        delete for each CV, and clearing this site&apos;s browsing data removes all of it at once.
        Export a JSON backup first if you want to keep any of it.
      </p>
    </LegalSection>

    <LegalSection id="children" heading="Age">
      <p>
        This is a tool for people applying for work and is not directed at children. Do not create
        an account if you are under 16.
      </p>
    </LegalSection>

    <LegalSection id="changes" heading="Changes to this policy">
      <p>
        If this changes, the date at the top changes with it. A change that affects what we do with
        data you have already given us will be sent to the email address on your account before it
        takes effect.
      </p>
      <p>
        The rules for using the service are in the{' '}
        <Link href={LEGAL_ROUTES.terms} className="text-fg underline">
          Terms of Service
        </Link>
        .
      </p>
    </LegalSection>
  </LegalShell>
);

