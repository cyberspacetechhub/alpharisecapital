import { emailLayout, BRAND_NAME } from "../layout";
import { emailButton, emailHeading, emailParagraph, emailAlert } from "../components";

export const welcomeEmail = (username: string, dashboardUrl: string): string =>
  emailLayout(
    `Welcome to ${BRAND_NAME}`,
    `
    ${emailHeading(`Welcome aboard, ${username}!`)}
    ${emailParagraph(`Your account has been successfully created on <strong>${BRAND_NAME}</strong>. We're excited to have you join our platform.`)}
    ${emailAlert("Your account is active. Complete your KYC to unlock full trading features.", "success")}
    ${emailParagraph("Here's what you can do next:")}
    <ul style="font-size:14px; color:#444; line-height:2; padding-left:20px; margin:10px 0;">
      <li>Complete your profile and KYC verification</li>
      <li>Link your wallet or bank account</li>
      <li>Make your first deposit</li>
      <li>Explore investment plans or open a trade position</li>
    </ul>
    ${emailButton("Go to Dashboard", dashboardUrl)}
    ${emailParagraph(`If you have any questions, our support team is always available at <a href="mailto:support@alphariseglobal.com">support@alphariseglobal.com</a>.`)}
    `
  );
