import { UserWithRole } from "../trpc/trpc";
import { sendEmail } from "../modules/Email/resend";

interface SendEmailToUserProps {
  user: UserWithRole;
  subject: string;
  body: string;
  from?: string;
}

export async function sendEmailToUser({
  user,
  subject,
  body,
}: SendEmailToUserProps) {
  const email = user.email;
  if (!email) {
    throw new Error("User has no email address");
  }

  await sendEmail({
    to: email,
    subject: subject,
    body: body,
  });
}
