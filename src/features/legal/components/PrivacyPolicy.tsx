import Link from 'next/link';

import {
  ACCOUNT_DELETION_DAYS,
  APP_NAME,
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

export const PrivacyPolicy = () => (
  <LegalShell
    title="Privacy Policy"
    summary={`How ${APP_NAME} handles your CV and your account. In short: the CV stays in your browser, and the account is an email address and a name.`}
  >
    <LegalSection id="short-version" heading="The short version">
      <LegalList
        items={[
          <>
            <strong className="text-fg font-semibold">Your CV lives in your browser</strong>, not on
            our servers. We do not have a copy of it and cannot read it.
          </>,
          <>
            <strong className="text-fg font-semibold">An account stores four things</strong>: your
            name, your email address, a password hash (or your Google account id), and your login
            sessions.
          </>,
          <>
            <strong className="text-fg font-semibold">
              No advertising, no analytics, no tracking cookies.
            </strong>{' '}
            We do not sell or share your data, and there is nobody to sell it to.
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

    <LegalSection id="who-we-are" heading="Who this is">
      <p>
        {APP_NAME} is run by {LEGAL_ENTITY}. Questions, requests and complaints go to <Mail />.
      </p>
    </LegalSection>

    <LegalSection id="your-cv" heading="Your CV stays in your browser">
      <p>
        Everything you type into the editor — your name, contact details, photograph, employment
        history, every bullet — is stored by your browser on your own device, in IndexedDB. It is
        saved as you type, and it is not uploaded anywhere. Clearing your browsing data deletes it,
        and we cannot recover it for you, because we never had it.
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
    </LegalSection>

    <LegalSection id="account" heading="What an account stores">
      <p>
        You only need an account to download a PDF. Everything else — writing, the ten designs, the
        theme controls, the ATS score, import, the JSON backup, the document library — works without
        one.
      </p>
      <p>When you create an account, our database holds:</p>
      <LegalList
        items={[
          'Your name and email address, as you entered them.',
          'A scrypt hash of your password. The password itself is never stored and cannot be recovered from the hash — that is why a forgotten password is reset rather than looked up.',
          'If you signed in with Google: the account identifier Google gives us, and the tokens Google issues for it. We ask Google for your name, email address and profile picture, and nothing else.',
          'One row per active session, holding a session token, the IP address and browser user-agent it was created from, and when it expires. This is what lets you stay signed in, and what makes it possible to sign every other browser out when you reset your password.',
          'Short-lived tokens for confirming your email address and resetting your password. Each is deleted once it is used, and expires within an hour either way.',
          'Counters keyed by IP address, used to rate-limit sign-in attempts.',
        ]}
      />
      <p>
        There is no field in our database for a CV, a job application, or anything you write in the
        editor.
      </p>
    </LegalSection>

    <LegalSection id="transit" heading="When your CV does reach our server">
      <p>
        Two features send document content off your device. Both are things you start deliberately.
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
        There are no advertising cookies, no analytics cookies and no third-party trackers on this
        site — which is why you have not been shown a cookie banner. Your theme choice and a few
        interface preferences are kept in your browser&apos;s local storage, which is not a cookie
        and never leaves your device.
      </p>
    </LegalSection>

    <LegalSection id="processors" heading="Who else touches this data">
      <p>Four services, each doing one job:</p>
      <LegalList
        items={[
          <>
            <strong className="text-fg font-semibold">Vercel</strong> hosts the site. Like any web
            host it keeps request logs, which include IP addresses.
          </>,
          <>
            <strong className="text-fg font-semibold">Neon</strong> hosts the database that holds
            accounts and sessions.
          </>,
          <>
            <strong className="text-fg font-semibold">Resend</strong> sends the two emails this
            service sends: confirm your address, and reset your password. It receives your email
            address in order to deliver them.
          </>,
          <>
            <strong className="text-fg font-semibold">Google</strong>, if and only if you choose to
            sign in with Google.
          </>,
        ]}
      />
      <p>
        None of them is sent your CV. We do not sell personal data, and we do not share it with
        anyone beyond the four above.
      </p>
    </LegalSection>

    <LegalSection id="retention" heading="How long it is kept">
      <p>
        Account data is kept while the account exists. Ask us to delete it and everything above is
        removed within {ACCOUNT_DELETION_DAYS} days, sessions included. Expired sessions and used
        tokens are deleted as they expire, without being asked.
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
