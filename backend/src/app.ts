import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware";
import { corsOptions } from "./config/cors";
import authRoutes from "./routes/auth.routes";
import transactionRoutes from "./routes/transaction.routes";
import investmentRoutes from "./routes/investment.routes";
import investmentPlanRoutes from "./routes/investmentPlan.routes";
import depositMethodRoutes from "./routes/depositMethod.routes";
import withdrawalMethodRoutes from "./routes/withdrawalMethod.routes";
import loanRoutes from "./routes/loan.routes";
import positionRoutes from "./routes/position.routes";
import userRoutes from "./routes/user.routes";
import walletLinkRoutes from "./routes/walletLink.routes";
import inAppMessageRoutes from "./routes/inAppMessage.routes";
import inboxRoutes from "./routes/inbox.routes";

const app = express();

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/investment-plans", investmentPlanRoutes);
app.use("/api/deposit-methods", depositMethodRoutes);
app.use("/api/withdrawal-methods", withdrawalMethodRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/positions", positionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/wallet-links", walletLinkRoutes);
app.use("/api/messages", inAppMessageRoutes);
app.use("/api/inbox", inboxRoutes);

app.use(errorHandler);

export default app;
