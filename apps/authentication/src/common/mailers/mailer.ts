import { resend } from './resendClient';

type Params = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  from?: string;
};

// const mailer_sender = 'no-reply <onboarding@resend.dev>';
const mailer_sender =
  process.env.NODE_ENV === 'development'
    ? `Squeezy <onboarding@resend.dev>`
    : `Squeezy <onboarding@resend.dev>`;

export const sendEmail = async ({
  to,
  from = mailer_sender,
  subject,
  text,
  html,
}: Params) =>
  await resend.emails.send({
    from,
    to: Array.isArray(to) ? to : [to],
    text,
    subject,
    html,
  });
