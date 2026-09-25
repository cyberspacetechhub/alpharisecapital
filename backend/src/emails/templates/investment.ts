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
    "Investment Activated",
    `
    ${emailHeading("Investment Activated ✓")}
    ${emailParagraph(`Hi <strong>${username}</strong>, your investment has been successfully activated.`)}
    ${emailInfoTable(
      emailInfoRow("Plan", planName) +
      emailInfoRow("Principal Invested", amount) +
      emailInfoRow("Expected ROI", roi) +
      emailInfoRow("Duration", `${durationDays} days`) +
      emailInfoRow("Maturity Date", maturityDate) +
      emailInfoRow("Status", "Active (Compounding)")
    )}
    ${emailAlert("Your investment is now running. Daily profits will drop every 24 hours until the cycle concludes.", "success")}
    ${emailButton("Track Investment", dashboardUrl)}
    `
  );

export const reinvestmentConfirmedEmail = (
  username: string,
  planName: string,
  amount: string,
  roi: string,
  durationDays: number,
  maturityDate: string,
  dashboardUrl: string
): string =>
  emailLayout(
    "Reinvestment Activated",
    `
    ${emailHeading("Reinvestment Activated ✓")}
    ${emailParagraph(`Hi <strong>${username}</strong>, your principal of <strong>${amount}</strong> has been successfully reinvested into the <strong>${planName}</strong> plan.`)}
    ${emailInfoTable(
      emailInfoRow("Plan", planName) +
      emailInfoRow("Reinvested Capital", amount) +
      emailInfoRow("Expected ROI", roi) +
      emailInfoRow("Duration", `${durationDays} days`) +
      emailInfoRow("Maturity Date", maturityDate) +
      emailInfoRow("Status", "Active (Compounding)")
    )}
    ${emailAlert("Your reinvestment is now active and compounding daily returns.", "success")}
    ${emailButton("Track Portfolio", dashboardUrl)}
    `
  );

export const investmentPlanExpiredEmail = (
  username: string,
  planName: string,
  amountInvested: string,
  earnings: string,
  durationDays: number,
  dashboardUrl: string
): string =>
  emailLayout(
    "Investment Cycle Completed",
    `
    ${emailHeading("Investment Completed & Credited 🎉")}
    ${emailParagraph(`Hi <strong>${username}</strong>, the final trade for your investment in <strong>${planName}</strong> has completed!`)}
    ${emailInfoTable(
      emailInfoRow("Plan", planName) +
      emailInfoRow("Principal Returned", amountInvested) +
      emailInfoRow("Total Profit Earned", earnings) +
      emailInfoRow("Duration", `${durationDays} days`) +
      emailInfoRow("Status", "Credited to Balance")
    )}
    ${emailAlert(`Both your principal of <strong>${amountInvested}</strong> and your profit of <strong>${earnings}</strong> have been credited to your available balance. You have a <strong>48-hour window</strong> to reinvest your previous traded amount (${amountInvested}) if you wish to start another compounding cycle.`, "success")}
    ${emailButton("Reinvest or Manage Funds", dashboardUrl)}
    `
  );

export const investmentTopUpEmail = (
  username: string,
  planName: string,
  topUpAmount: string,
  newTotalAmount: string,
  remainingDays: number,
  newDailyProfit: string,
  dashboardUrl: string
): string =>
  emailLayout(
    "Investment Top-Up Processed",
    `
    ${emailHeading("Investment Top-Up Successful ✓")}
    ${emailParagraph(`Hi <strong>${username}</strong>, a top-up of <strong>${topUpAmount}</strong> was successfully applied to your active <strong>${planName}</strong> contract.`)}
    ${emailInfoTable(
      emailInfoRow("Plan", planName) +
      emailInfoRow("Top-Up Amount", topUpAmount) +
      emailInfoRow("New Total Invested", newTotalAmount) +
      emailInfoRow("Remaining Duration", `${remainingDays} days`) +
      emailInfoRow("Recalculated Daily Yield", newDailyProfit)
    )}
    ${emailAlert("Your future daily profits have been recalculated based on your increased capital and remaining contract days.", "success")}
    ${emailButton("View Active Contract", dashboardUrl)}
    `
  );

export const investmentCancelledEmail = (
  username: string,
  planName: string,
  amount: string,
  reason: string,
  dashboardUrl: string
): string =>
  emailLayout(
    "Investment Cancelled",
    `
    ${emailHeading("Investment Cancelled")}
    ${emailParagraph(`Hi <strong>${username}</strong>, your investment in <strong>${planName}</strong> has been cancelled by administration.`)}
    ${emailInfoTable(
      emailInfoRow("Plan", planName) +
      emailInfoRow("Principal Refunded", amount) +
      emailInfoRow("Reason", reason) +
      emailInfoRow("Status", "Refunded to Balance")
    )}
    ${emailAlert(`The principal capital of <strong>${amount}</strong> has been returned to your available account balance.`, "warning")}
    ${emailButton("Check Account Balance", dashboardUrl)}
    `
  );

export const investmentForfeitedEmail = (
  username: string,
  planName: string,
  amount: string,
  dashboardUrl: string
): string =>
  emailLayout(
    "Investment Forfeited",
    `
    ${emailHeading("Investment Trade Forfeited")}
    ${emailParagraph(`Hi <strong>${username}</strong>, your request to forfeit your ongoing investment in <strong>${planName}</strong> has been processed.`)}
    ${emailInfoTable(
      emailInfoRow("Plan", planName) +
      emailInfoRow("Principal Returned", amount) +
      emailInfoRow("Status", "Forfeited & Settled")
    )}
    ${emailAlert(`The principal amount of <strong>${amount}</strong> has been returned to your available account balance.`, "warning")}
    ${emailButton("View Portfolio", dashboardUrl)}
    `
  );

export const investmentFundsAvailableEmail = investmentPlanExpiredEmail;
export const investmentCompletedEmail = investmentPlanExpiredEmail;
