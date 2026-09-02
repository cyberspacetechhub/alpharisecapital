export interface User {
  _id: string;
  username: string;
  email: string;
  phone?: string;
  isVerified: boolean;
  isActive: boolean;
  kycStatus: "none" | "pending" | "approved" | "rejected";
  kycDocuments: string[];
  balance: number;
  investedBalance: number;
  pendingWithdrawal: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalInvested: number;
  totalEarnings: number;
  creditScore: number;
  loanLimit: number;
  lastLogin?: string;
  profile?: Profile;
  createdAt: string;
}

export interface Profile {
  _id: string;
  user: string;
  type: "Trader" | "Executor";
  avatar?: string;
  bio?: string;
  country?: string;
  timezone?: string;
}

export interface TraderProfile extends Profile {
  type: "Trader";
  tradingExperience: "beginner" | "intermediate" | "expert";
  preferredAssets: string[];
  activeInvestments: number;
  referralCode?: string;
  referredBy?: string;
  totalReferrals: number;
}

export interface ExecutorProfile extends Profile {
  type: "Executor";
  department: string;
  canApproveDeposits: boolean;
  canApproveWithdrawals: boolean;
  canManagePlans: boolean;
  canManageUsers: boolean;
}

export interface Transaction {
  _id: string;
  user: string | User;
  type: "deposit" | "withdrawal" | "investment" | "reinvestment" | "loan_disbursement" | "loan_repayment" | "bonus" | "adjustment" | "admin_credit" | "admin_debit";
  amount: number;
  status: "pending" | "approved" | "rejected" | "completed" | "matured" | "reinvested";
  reference: string;
  methodId?: string;
  planId?: string;
  planSnapshot?: {
    name: string;
    roiPercent: number;
    durationDays: number;
    minAmount: number;
    maxAmount: number;
  };
  isReinvestment: boolean;
  meta?: Record<string, any>;
  expiresAt?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface InvestmentPlan {
  _id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  roiPercent: number;
  durationDays: number;
  isActive: boolean;
}

export interface DepositMethod {
  _id: string;
  name: string;
  type: "crypto" | "bank";
  image?: string;
  details: Record<string, string>;
  isActive: boolean;
}

export interface WithdrawalMethod {
  _id: string;
  name: string;
  type: "crypto" | "bank";
  image?: string;
  details: Record<string, string>;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
}

export interface LoanOffer {
  _id: string;
  title: string;
  description?: string;
  interestRate: number;
  interestType: "flat" | "compound";
  minAmount: number;
  maxAmount: number;
  durationDays: number;
  isActive: boolean;
}

export interface LoanApplication {
  _id: string;
  user: string | User;
  offer: string | LoanOffer;
  requestedAmount: number;
  amountDue: number;
  repaidAmount: number;
  interestRate: number;
  interestType: "flat" | "compound";
  durationDays: number;
  dueDate?: string;
  status: "pending" | "approved" | "rejected" | "active" | "repaid";
  createdAt: string;
}

export interface Position {
  _id: string;
  user: string | User;
  pair: string;
  direction: "long" | "short";
  entryPrice: number;
  currentPrice: number;
  exitPrice?: number;
  amount: number;
  leverage: number;
  stopLoss?: number;
  takeProfit?: number;
  unrealizedPnL: number;
  realizedPnL?: number;
  status: "open" | "closed" | "liquidated";
  openedAt: string;
  closedAt?: string;
  closedBy?: "trader" | "executor" | "system";
  expiresAt: string;
  updatedAt?: string;
  meta?: Record<string, any>;
}

export interface WalletLink {
  _id: string;
  user: string;
  type: "crypto" | "bank";
  label: string;
  details: Record<string, string>;
  isPrimary: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface InAppMessage {
  _id: string;
  sender?: string | User;
  recipient: string | User;
  subject: string;
  body: string;
  type: "system" | "direct";
  isRead: boolean;
  readAt?: string;
  relatedModel?: "Transaction" | "Loan" | "Position";
  relatedId?: string;
  createdAt: string;
}

export interface DashboardSummary {
  username: string;
  email: string;
  balance: number;
  investedBalance: number;
  pendingWithdrawal: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalInvested: number;
  totalEarnings: number;
  bonus?: number;
  referralCode?: string;
  referredBy?: string | null;
  totalReferrals?: number;
  creditScore: number;
  loanLimit: number;
  kycStatus: string;
  isVerified: boolean;
  activeInvestments: number;
  openPositions: number;
  activeLoans: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
  page?: number;
  pages?: number;
}
