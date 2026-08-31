import { emailLayout, BRAND_NAME } from "../layout";
import { emailButton, emailHeading, emailParagraph, emailAlert } from "../components";

export const passwordResetEmail = (username: string, resetUrl: string): string =>
  emailLayout(
    `Reset your ${BRAND_NAME} password`,
    `
    ${emailHeading("Password Reset Request")}
    ${emailParagraph(`Hi <strong>${username}</strong>, we received a request to reset your password.`)}
    ${emailAlert("This reset link expires in 1 hour. If you did not request this, secure your account immediately.", "warning")}
    ${emailButton("Reset My Password", resetUrl)}
    ${emailParagraph("If you did not request a password reset, please ignore this email or contact support if you believe your account is at risk.")}
    `
  );
