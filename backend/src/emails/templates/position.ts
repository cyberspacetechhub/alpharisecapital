import { emailLayout } from "../layout";
import { emailHeading, emailParagraph, emailAlert, emailInfoTable, emailInfoRow, emailButton } from "../components";

export const positionClosedEmail = (
  username: string,
  pair: string,
  direction: string,
  entryPrice: string,
  exitPrice: string,
  amount: string,
  realizedPnL: string,
  closedBy: string,
  dashboardUrl: string
): string => {
  const isProfit = realizedPnL.startsWith("-") === false;
  return emailLayout(
    "Position Closed",
    `
    ${emailHeading(`Position Closed — ${pair}`)}
    ${emailParagraph(`Hi <strong>${username}</strong>, your trading position has been closed.`)}
    ${emailInfoTable(
      emailInfoRow("Pair", pair) +
      emailInfoRow("Direction", direction.toUpperCase()) +
      emailInfoRow("Entry Price", entryPrice) +
      emailInfoRow("Exit Price", exitPrice) +
      emailInfoRow("Amount", amount) +
      emailInfoRow("Realized P&L", realizedPnL) +
      emailInfoRow("Closed By", closedBy)
    )}
    ${emailAlert(
      isProfit
        ? `Congratulations! Your position closed in profit.`
        : `Your position closed at a loss. Review your strategy and try again.`,
      isProfit ? "success" : "danger"
    )}
    ${emailButton("View Trading History", dashboardUrl)}
    `
  );
};
