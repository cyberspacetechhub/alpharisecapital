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
    ${emailParagraph(`Hi <strong>${username}</strong>, your withdrawal request of <strong>${amount}</strong> via <strong>${method}</strong> has been submitted and is pending review.`)}
    ${emailInfoTable(
      emailInfoRow("Amount", amount) +
      emailInfoRow("Method", method) +
      emailInfoRow("Reference", reference) +
      emailInfoRow("Status", "Pending Review")
    )}
    ${emailAlert("Withdrawals are typically processed within 1–3 business days.", "warning")}
    ${emailButton("View Transaction", dashboardUrl)}
    `
  );

export const withdrawalApprovedEmail = (
  username: string,
  amount: string,
  method: string,
  reference: string,
  dashboardUrl: string
): string =>
  emailLayout(
    "Withdrawal Successful",
    `
    ${emailHeading("Withdrawal Successful ✓")}
    ${emailParagraph(`Hi <strong>${username}</strong>, your withdrawal request of <strong>${amount}</strong> via <strong>${method}</strong> was successful.`)}
    ${emailInfoTable(
      emailInfoRow("Amount", amount) +
      emailInfoRow("Method", method) +
      emailInfoRow("Reference", reference) +
      emailInfoRow("Status", "Successful")
    )}
    ${emailAlert(`Funds have been disbursed via ${method}. Depending on your receiving financial provider/network, it should reflect shortly.`, "success")}
    ${emailButton("Go to Dashboard", dashboardUrl)}
    `
  );

export const withdrawalRejectedEmail = (
  username: string,
  amount: string,
  method: string,
  reference: string,
  reason: string,
  dashboardUrl: string
): string =>
  emailLayout(
    "Withdrawal Rejected",
    `
    ${emailHeading("Withdrawal Rejected")}
    ${emailParagraph(`Hi <strong>${username}</strong>, your withdrawal request of <strong>${amount}</strong> via <strong>${method}</strong> has been rejected.`)}
    ${emailInfoTable(
      emailInfoRow("Amount", amount) +
      emailInfoRow("Method", method) +
      emailInfoRow("Reference", reference) +
      emailInfoRow("Reason", reason) +
      emailInfoRow("Status", "Rejected")
    )}
    ${emailAlert("The amount has been returned to your account balance.", "danger")}
    ${emailButton("Contact Support", "mailto:support@alphariseglobal.com")}
    `
  );
