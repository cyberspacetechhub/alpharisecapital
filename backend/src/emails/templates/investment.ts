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
    ${emailHeading("Investment Cycle Completed ✓")}
    ${emailParagraph(`Hi <strong>${username}</strong>, the final daily profit for your investment in <strong>${planName}</strong> has been processed and your trading cycle has now concluded.`)}
    ${emailInfoTable(
      emailInfoRow("Plan", planName) +
      emailInfoRow("Principal Invested", amountInvested) +
      emailInfoRow("Total ROI Earned", earnings) +
      emailInfoRow("Duration Completed", `${durationDays} days`) +
      emailInfoRow("Settlement Window", "48 Hours")
    )}
    ${emailAlert(`Your daily yield has been credited to your balance. You can <strong>Reinvest</strong> your principal within the next 48 hours to continue daily compounding, or check back after <strong>48 hours</strong> when your principal of ${amountInvested} will automatically return to your available balance and become ready for withdrawal.`, "warning")}
    ${emailButton("Reinvest or Manage Funds", dashboardUrl)}
    `
  );

export const investmentFundsAvailableEmail = (
  username: string,
  planName: string,
  payoutAmount: string,
  dashboardUrl: string
): string =>
  emailLayout(
    "Investment Funds Available",
    `
    ${emailHeading("Principal Capital Released 🎉")}
    ${emailParagraph(`Hi <strong>${username}</strong>, your investment in <strong>${planName}</strong> has completed its 48-hour maturity settlement period.`)}
    ${emailInfoTable(
      emailInfoRow("Plan", planName) +
      emailInfoRow("Principal Released", payoutAmount) +
      emailInfoRow("Status", "Available in Balance")
    )}
    ${emailAlert(`Your funds of <strong>${payoutAmount}</strong> are now available in your account balance and ready for withdrawal or a new investment.`, "success")}
    ${emailButton("Request Withdrawal", dashboardUrl)}
    `
  );

// Backwards-compatible alias
export const investmentCompletedEmail = investmentPlanExpiredEmail;
