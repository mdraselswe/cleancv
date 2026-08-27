import 'server-only';

import { Resend } from 'resend';

import { isProduction, serverEnv } from '../env';
import type { EmailContent } from './templates';

/**
 * Sending one email.
 *
 * Resend where a key exists. Where one does not, the message is printed to the
 * server log instead — on a development machine the link in that log is exactly
 * what the reader would have clicked, and a sign-up flow that cannot be
 * finished without a mail provider is a flow nobody can test locally.
 *
 * A missing key in production is not a convenience, so it fails loudly there.
 */

export interface SendResult {
  delivered: boolean;
}

const logInstead = (to: string, content: EmailContent): SendResult => {
  console.warn(
    [
      '',
      '─── email not sent (RESEND_API_KEY is not set) ───',
      `to:      ${to}`,
      `subject: ${content.subject}`,
      '',
      content.text,
      '──────────────────────────────────────────────────',
      '',
    ].join('\n'),
  );

  return { delivered: false };
};

export const sendEmail = async (to: string, content: EmailContent): Promise<SendResult> => {
  const env = serverEnv();

  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    if (isProduction()) {
      throw new Error('RESEND_API_KEY and EMAIL_FROM must be set to send email in production.');
    }

    return logInstead(to, content);
  }

  const { error } = await new Resend(env.RESEND_API_KEY).emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });

  if (error) {
    /*
     * Thrown, but do not expect it to reach the reader: Better Auth sends the
     * sign-up email as a background task and turns a throw here into a log
     * line, so the request still answers 200 and the page still says "check
     * your inbox". Verified against production, where a send to `example.com`
     * failed exactly that way.
     *
     * So this is for the operator, not the user — it is what puts the reason in
     * the runtime log instead of leaving a silent nothing. The reader's way out
     * is the sign-in page, which offers to send the link again.
     */
    throw new Error(`Could not send the email: ${error.message}`);
  }

  return { delivered: true };
};
