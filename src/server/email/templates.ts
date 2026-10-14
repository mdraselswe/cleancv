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
  <p style="font-size:14px;color:#6b7280;margin:0 0 24px">${escapeHtml(APP_NAME)}</p>
  <h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(heading)}</h1>
  <p style="font-size:15px;margin:0 0 24px">${escapeHtml(body)}</p>
  <p style="margin:0 0 28px">
    <a href="${action.url}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:500;padding:11px 20px;border-radius:10px">${escapeHtml(action.label)}</a>
  </p>
  <p style="font-size:13px;color:#6b7280;margin:0 0 8px">অথবা এই ঠিকানাটি আপনার ব্রাউজারে পেস্ট করুন:</p>
  <p style="font-size:13px;color:#6b7280;word-break:break-all;margin:0">${escapeHtml(action.url)}</p>
</div>`;

export const verifyEmail = (url: string): EmailContent => ({
  subject: `${APP_NAME}-এর জন্য আপনার ইমেইল নিশ্চিত করুন`,
  html: shell(
    'আপনার ইমেইল নিশ্চিত করুন',
    'এক ক্লিকেই আপনার অ্যাকাউন্ট প্রস্তুত। লিংকটি এক ঘণ্টা কাজ করবে।',
    { label: 'ইমেইল নিশ্চিত করুন', url },
  ),
  text: [
    `${APP_NAME}-এর জন্য আপনার ইমেইল নিশ্চিত করুন।`,
    '',
    url,
    '',
    'লিংকটি এক ঘণ্টা কাজ করবে। আপনি অ্যাকাউন্ট না খুলে থাকলে এটি উপেক্ষা করুন।',
  ].join('\n'),
});

export const resetPasswordEmail = (url: string): EmailContent => ({
  subject: `আপনার ${APP_NAME} পাসওয়ার্ড রিসেট করুন`,
  html: shell(
    'আপনার পাসওয়ার্ড রিসেট করুন',
    'নিচের লিংক দিয়ে নতুন পাসওয়ার্ড বেছে নিন। লিংকটি এক ঘণ্টা কাজ করবে, আর শুধু একবারই।',
    { label: 'নতুন পাসওয়ার্ড বেছে নিন', url },
  ),
  text: [
    `আপনার ${APP_NAME} পাসওয়ার্ড রিসেট করুন।`,
    '',
    url,
    '',
    'লিংকটি এক ঘণ্টা কাজ করবে, আর শুধু একবারই। আপনি এটি না চেয়ে থাকলে',
    'কিছুই বদলায়নি, এই ইমেইল উপেক্ষা করতে পারেন।',
  ].join('\n'),
});
