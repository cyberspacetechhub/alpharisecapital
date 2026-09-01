import { emailLayout } from "../layout";
import { emailHeading, emailParagraph, emailAlert, emailInfoTable, emailInfoRow, emailButton } from "../components";

export const withdrawalRequestedEmail = (
  username: string,
  amount: string,
  method: string,
  reference: string,
  dashboardUrl: string
): string =>
  emailLayout(
    "Withdrawal Requested",
    `
    ${emailHeading("Withdrawal Request Submitted")}
    ${emailParagraph(`Hi <strong>${username}</strong>, your withdrawal request has been submitted and is pending approval.`)}
    ${emailInfoTable(
      emailInfoRow("Amount", amount) +
      emailInfoRow("Method", method) +
      emailInfoRow("Reference", reference) +
      emailInfoRow("Status", "Pending Approval")
    )}
    ${emailAlert("Withdrawals are typically processed within 1–3 business days.", "warning")}
    ${emailButton("View Transaction", dashboardUrl)}
    `
  );

export const withdrawalApprovedEmail = (
  username: string,
  amount: string,
  reference: string,
  dashboardUrl: string
): string =>
  emailLayout(
    "Withdrawal Approved",
    `
    ${emailHeading("Withdrawal Approved ✓")}
    ${emailParagraph(`Hi <strong>${username}</strong>, your withdrawal has been approved and is being processed.`)}
    ${emailInfoTable(
      emailInfoRow("Amount", amount) +
      emailInfoRow("Reference", reference) +
      emailInfoRow("Status", "Approved & Processing")
    )}
    ${emailAlert("Funds will arrive in your account based on your selected withdrawal method's processing time.", "success")}
    ${emailButton("Go to Dashboard", dashboardUrl)}
    `
  );

export const withdrawalRejectedEmail = (
  username: string,
  amount: string,
  reference: string,
  reason: string,
  dashboardUrl: string
): string =>
  emailLayout(
    "Withdrawal Rejected",
    `
    ${emailHeading("Withdrawal Rejected")}
    ${emailParagraph(`Hi <strong>${username}</strong>, your withdrawal request has been rejected.`)}
    ${emailInfoTable(
      emailInfoRow("Amount", amount) +
      emailInfoRow("Reference", reference) +
      emailInfoRow("Reason", reason) +
      emailInfoRow("Status", "Rejected")
    )}
    ${emailAlert("The amount has been returned to your account balance.", "danger")}
    ${emailButton("Contact Support", "mailto:support@alphariseglobal.com")}
    `
  );
