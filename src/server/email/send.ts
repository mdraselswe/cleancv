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
     * Thrown rather than swallowed. Better Auth calls this while completing a
     * sign-up, and a silent failure there leaves the reader on a page saying
     * "check your inbox" for an email that was never sent.
     */
    throw new Error(`Could not send the email: ${error.message}`);
  }

  return { delivered: true };
};
