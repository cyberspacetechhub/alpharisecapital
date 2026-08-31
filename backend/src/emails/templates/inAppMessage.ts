import { emailLayout, BRAND_NAME } from "../layout";
import { emailHeading, emailParagraph, emailButton } from "../components";

export const inAppMessageNotificationEmail = (
  username: string,
  subject: string,
  preview: string,
  dashboardUrl: string
): string =>
  emailLayout(
    `New Message on ${BRAND_NAME}`,
    `
    ${emailHeading("You Have a New Message")}
    ${emailParagraph(`Hi <strong>${username}</strong>, you have received a new message on ${BRAND_NAME}.`)}
    <div style="background:#f0f7f4; border-left:4px solid #2d6a4f; padding:16px 20px; border-radius:4px; margin:16px 0;">
      <p style="font-size:13px; color:#1a3a2a; font-weight:600; margin-bottom:6px;">${subject}</p>
      <p style="font-size:13px; color:#555; margin:0;">${preview}...</p>
    </div>
    ${emailParagraph("Log in to your dashboard to read the full message and reply.")}
    ${emailButton("Read Message", dashboardUrl)}
    `
  );
