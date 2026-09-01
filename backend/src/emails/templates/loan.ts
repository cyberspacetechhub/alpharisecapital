import { emailLayout } from "../layout";
import { emailHeading, emailParagraph, emailAlert, emailInfoTable, emailInfoRow, emailButton } from "../components";

export const loanApprovedEmail = (
  username: string,
  amount: string,
  amountDue: string,
  interestRate: string,
  dueDate: string,
  dashboardUrl: string
): string =>
  emailLayout(
    "Loan Approved",
    `
    ${emailHeading("Loan Approved ✓")}
    ${emailParagraph(`Hi <strong>${username}</strong>, your loan request has been approved and credited to your account.`)}
    ${emailInfoTable(
      emailInfoRow("Loan Amount", amount) +
      emailInfoRow("Interest Rate", interestRate) +
      emailInfoRow("Total Amount Due", amountDue) +
      emailInfoRow("Due Date", dueDate) +
      emailInfoRow("Status", "Active")
    )}
    ${emailAlert("Please ensure you repay your loan before the due date to avoid penalties.", "warning")}
    ${emailButton("Manage Loan", dashboardUrl)}
    `
  );

export const loanRejectedEmail = (
  username: string,
  amount: string,
  reason: string,
  dashboardUrl: string
): string =>
  emailLayout(
    "Loan Rejected",
    `
    ${emailHeading("Loan Request Rejected")}
    ${emailParagraph(`Hi <strong>${username}</strong>, your loan request has been reviewed and rejected.`)}
    ${emailInfoTable(
      emailInfoRow("Requested Amount", amount) +
      emailInfoRow("Reason", reason) +
      emailInfoRow("Status", "Rejected")
    )}
    ${emailAlert("You may reapply after resolving the issue or contact support for assistance.", "danger")}
    ${emailButton("Contact Support", "support@alphariseglobal.com")}
    `
  );

export const loanDueReminderEmail = (
  username: string,
  amountDue: string,
  dueDate: string,
  daysLeft: number,
  dashboardUrl: string
): string =>
  emailLayout(
    "Loan Due Reminder",
    `
    ${emailHeading("Loan Repayment Reminder")}
    ${emailParagraph(`Hi <strong>${username}</strong>, this is a reminder that your loan repayment is due soon.`)}
    ${emailInfoTable(
      emailInfoRow("Amount Due", amountDue) +
      emailInfoRow("Due Date", dueDate) +
      emailInfoRow("Days Remaining", `${daysLeft} day${daysLeft !== 1 ? "s" : ""}`)
    )}
    ${emailAlert(`Your loan is due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. Please ensure sufficient balance for repayment.`, "warning")}
    ${emailButton("Repay Now", dashboardUrl)}
    `
  );
