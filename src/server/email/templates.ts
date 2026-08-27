import { APP_NAME } from '@/constants';

/**
 * The two emails this app sends, as plain strings.
 *
 * No React, no MJML, no layout engine: both are one sentence and one link, and
 * an HTML email that tries for more breaks differently in every client. The
 * text part is not a fallback — it is what a screen reader and a plain-text
 * client actually get, so it says the same thing rather than "view in browser".
 */

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char,
  );

/**
 * One shell for both. Inline styles only — Gmail strips `<style>` blocks, and a
 * mail client's default is a serif on a white page whatever the reader's theme.
 */
const shell = (heading: string, body: string, action: { label: string; url: string }): string => `
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.55;color:#161a21;max-width:520px;margin:0 auto;padding:32px 24px">
  <p style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;margin:0 0 24px">${escapeHtml(APP_NAME)}</p>
  <h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(heading)}</h1>
  <p style="font-size:15px;margin:0 0 24px">${escapeHtml(body)}</p>
  <p style="margin:0 0 28px">
    <a href="${action.url}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:500;padding:11px 20px;border-radius:10px">${escapeHtml(action.label)}</a>
  </p>
  <p style="font-size:13px;color:#6b7280;margin:0 0 8px">Or paste this into your browser:</p>
  <p style="font-size:13px;color:#6b7280;word-break:break-all;margin:0">${escapeHtml(action.url)}</p>
</div>`;

export const verifyEmail = (url: string): EmailContent => ({
  subject: `Confirm your email for ${APP_NAME}`,
  html: shell(
    'Confirm your email',
    'One click and your account is ready. The link works for an hour.',
    { label: 'Confirm email', url },
  ),
  text: [
    `Confirm your email for ${APP_NAME}.`,
    '',
    url,
    '',
    'The link works for an hour. If you did not create an account, ignore this.',
  ].join('\n'),
});

export const resetPasswordEmail = (url: string): EmailContent => ({
  subject: `Reset your ${APP_NAME} password`,
  html: shell(
    'Reset your password',
    'Choose a new password with the link below. It works for an hour, and only once.',
    { label: 'Choose a new password', url },
  ),
  text: [
    `Reset your ${APP_NAME} password.`,
    '',
    url,
    '',
    'The link works for an hour, and only once. If you did not ask for this,',
    'nothing has changed and you can ignore this email.',
  ].join('\n'),
});
