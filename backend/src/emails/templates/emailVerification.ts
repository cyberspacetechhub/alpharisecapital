import { emailLayout, BRAND_NAME } from "../layout";
import { emailButton, emailHeading, emailParagraph, emailAlert } from "../components";

export const emailVerificationEmail = (username: string, verifyUrl: string): string =>
  emailLayout(
    `Verify your ${BRAND_NAME} email`,
    `
    ${emailHeading("Verify Your Email Address")}
    ${emailParagraph(`Hi <strong>${username}</strong>, please verify your email address to activate your ${BRAND_NAME} account.`)}
    ${emailAlert("This verification link expires in 24 hours.", "warning")}
    ${emailButton("Verify Email Address", verifyUrl)}
    ${emailParagraph("If you did not create an account, you can safely ignore this email.")}
    `
  );
