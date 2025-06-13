import { Resend } from "resend";
import { CONSTANTS } from "common/constants";

const resend = new Resend(CONSTANTS.RESEND.API_KEY);

interface SendEmailProps {
  from?: string;
  to: string;
  subject: string;
  body: string;
}

export async function sendEmail(data: SendEmailProps) {
  const from = "info@service.com";

  try {
    await resend.emails.send({
      to: data.to,
      subject: data.subject,
      html: data.body,
      from,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Failed to send email");
  }
}
