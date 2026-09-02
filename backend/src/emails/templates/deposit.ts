import { emailLayout } from "../layout";
import { emailHeading, emailParagraph, emailAlert, emailInfoTable, emailInfoRow, emailButton } from "../components";

export const depositReceivedEmail = (
  username: string,
  amount: string,
  method: string,
  reference: string,
  dashboardUrl: string
): string =>
  emailLayout(
    "Deposit Received",
    `
    ${emailHeading("Deposit Request Received")}
    ${emailParagraph(`Hi <strong>${username}</strong>, we have received your deposit request of <strong>${amount}</strong> via <strong>${method}</strong> and it is currently under review.`)}
    ${emailInfoTable(
      emailInfoRow("Amount", amount) +
      emailInfoRow("Method", method) +
      emailInfoRow("Reference", reference) +
      emailInfoRow("Status", "Pending Review")
    )}
    ${emailAlert("Your deposit will be confirmed within 1–24 hours depending on network/bank processing times.", "warning")}
    ${emailButton("View Transaction", dashboardUrl)}
    `
  );

export const depositApprovedEmail = (
  username: string,
  amount: string,
  method: string,
  reference: string,
  newBalance: string,
  dashboardUrl: string
): string =>
  emailLayout(
    "Deposit Successful",
    `
    ${emailHeading("Deposit Successful ✓")}
    ${emailParagraph(`Hi <strong>${username}</strong>, your deposit of <strong>${amount}</strong> via <strong>${method}</strong> was successful and has been credited to your account.`)}
    ${emailInfoTable(
      emailInfoRow("Amount Credited", amount) +
      emailInfoRow("Method", method) +
      emailInfoRow("Reference", reference) +
      emailInfoRow("New Balance", newBalance) +
      emailInfoRow("Status", "Successful")
    )}
    ${emailAlert("Your funds are now available for trading or investment.", "success")}
    ${emailButton("Go to Dashboard", dashboardUrl)}
    `
  );

export const depositRejectedEmail = (
  username: string,
  amount: string,
  method: string,
  reference: string,
  reason: string,
  dashboardUrl: string
): string =>
  emailLayout(
    "Deposit Rejected",
    `
    ${emailHeading("Deposit Rejected")}
    ${emailParagraph(`Hi <strong>${username}</strong>, unfortunately your deposit request of <strong>${amount}</strong> via <strong>${method}</strong> has been rejected.`)}
    ${emailInfoTable(
      emailInfoRow("Amount", amount) +
      emailInfoRow("Method", method) +
      emailInfoRow("Reference", reference) +
      emailInfoRow("Reason", reason) +
      emailInfoRow("Status", "Rejected")
    )}
    ${emailAlert("If you believe this is an error, please contact our support team.", "danger")}
    ${emailButton("Contact Support", "mailto:support@alphariseglobal.com")}
    `
  );
