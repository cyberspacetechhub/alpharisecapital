import { emailLayout } from "../layout";
import { emailHeading, emailParagraph, emailAlert, emailInfoTable, emailInfoRow, emailButton } from "../components";

export const investmentStartedEmail = (
  username: string,
  planName: string,
  amount: string,
  roi: string,
  durationDays: number,
  maturityDate: string,
  dashboardUrl: string
): string =>
  emailLayout(
    "Investment Started",
    `
    ${emailHeading("Investment Activated ✓")}
    ${emailParagraph(`Hi <strong>${username}</strong>, your investment has been successfully activated.`)}
    ${emailInfoTable(
      emailInfoRow("Plan", planName) +
      emailInfoRow("Amount Invested", amount) +
      emailInfoRow("Expected ROI", roi) +
      emailInfoRow("Duration", `${durationDays} days`) +
      emailInfoRow("Maturity Date", maturityDate) +
      emailInfoRow("Status", "Active")
    )}
    ${emailAlert("Your investment is now running. You will be notified when it matures.", "success")}
    ${emailButton("Track Investment", dashboardUrl)}
    `
  );

export const investmentCompletedEmail = (
  username: string,
  planName: string,
  amountInvested: string,
  earnings: string,
  totalReturned: string,
  dashboardUrl: string
): string =>
  emailLayout(
    "Investment Completed",
    `
    ${emailHeading("Investment Matured 🎉")}
    ${emailParagraph(`Hi <strong>${username}</strong>, your investment plan has matured and your returns have been credited.`)}
    ${emailInfoTable(
      emailInfoRow("Plan", planName) +
      emailInfoRow("Amount Invested", amountInvested) +
      emailInfoRow("Earnings", earnings) +
      emailInfoRow("Total Returned", totalReturned) +
      emailInfoRow("Status", "Completed")
    )}
    ${emailAlert("Your returns are now available in your account balance.", "success")}
    ${emailButton("Go to Dashboard", dashboardUrl)}
    `
  );
