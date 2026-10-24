import { Resend } from "resend";

export async function sendEmail(payload: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY and RESEND_FROM_EMAIL must be configured");
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    ...payload,
  });

  if (error) {
    throw new Error(`Resend email failed (${error.name}): ${error.message}`);
  }

  return data;
}
