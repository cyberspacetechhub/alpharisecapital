import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { ExecutorRoute } from "./ExecutorRoute";
import ScrollToTop from "../components/common/ScrollToTop";

// Auth
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";
import HomePage from "../pages/public/HomePage";
import PublicLayout from "../components/layout/PublicLayout";
import AboutPage from "../pages/public/AboutPage";
import ServicesPage from "../pages/public/ServicesPage";
import SupportPage from "../pages/public/SupportPage";
import TermsPage from "../pages/public/TermsPage";
import PolicyPage from "../pages/public/PolicyPage";

// Trader pages
import TraderLayout from "../components/layout/TraderLayout";
import TraderDashboard from "../pages/trader/TraderDashboard";
import DepositPage from "../pages/trader/deposit/DepositPage";
import TraderTransactionsPage from "../pages/trader/transactions/TransactionsPage";
import WithdrawalPage from "../pages/trader/withdrawal/WithdrawalPage";
import InvestmentsPage from "../pages/trader/investments/InvestmentsPage";
import PositionsPage from "../pages/trader/positions/PositionsPage";
import LoansPage from "../pages/trader/loans/LoansPage";
import WalletPage from "../pages/trader/wallet/WalletPage";
import ConnectWalletPage from "../pages/trader/wallet/ConnectWalletPage";
import StocksPage from "../pages/trader/stocks/StocksPage";
import TraderNotificationsPage from "../pages/trader/notifications/NotificationsPage";
import TraderMessagesPage from "../pages/trader/messages/MessagesPage";
import TraderProfilePage from "../pages/trader/profile/ProfilePage";
import KycPage from "../pages/trader/kyc/KycPage";

// Executor pages
import ExecutorLayout from "../components/layout/ExecutorLayout";
import ExecutorDashboard from "../pages/executor/ExecutorDashboard";
import ClientsPage from "../pages/executor/clients/ClientsPage";
import ClientDetailPage from "../pages/executor/clients/ClientDetailPage";
import ExecutorTransactionsPage from "../pages/executor/transactions/TransactionsPage";
import ExecutorInvestmentsPage from "../pages/executor/investments/InvestmentsPage";
import ExecutorLoansPage from "../pages/executor/loans/LoansPage";
import ExecutorPositionsPage from "../pages/executor/positions/PositionsPage";
import DepositMethodsPage from "../pages/executor/methods/DepositMethodsPage";
import WithdrawalMethodsPage from "../pages/executor/methods/WithdrawalMethodsPage";
import WalletsPage from "../pages/executor/wallets/WalletsPage";
import ExecutorMessagesPage from "../pages/executor/messages/MessagesPage";
import ResendInboxPage from "../pages/executor/inbox/ResendInboxPage";
import ExecutorProfilePage from "../pages/executor/profile/ProfilePage";
import KycReviewPage from "../pages/executor/kyc/KycReviewPage";

const AppRouter = () => (
  <BrowserRouter>
    <ScrollToTop />
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/policy" element={<PolicyPage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Trader */}
      <Route element={<ProtectedRoute />}>
        <Route path="/trader" element={<TraderLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TraderDashboard />} />
          <Route path="deposit" element={<DepositPage />} />
          <Route path="withdrawal" element={<WithdrawalPage />} />
          <Route path="investments" element={<InvestmentsPage />} />
          <Route path="positions" element={<PositionsPage />} />
          <Route path="loans" element={<LoansPage />} />
          <Route path="transactions" element={<TraderTransactionsPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="wallet/connect" element={<ConnectWalletPage />} />
          <Route path="stocks" element={<StocksPage />} />
          <Route path="notifications" element={<TraderNotificationsPage />} />
          <Route path="messages" element={<TraderMessagesPage />} />
          <Route path="profile" element={<TraderProfilePage />} />
          <Route path="kyc" element={<KycPage />} />
        </Route>
      </Route>

      {/* Executor */}
      <Route element={<ExecutorRoute />}>
        <Route path="/executor" element={<ExecutorLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ExecutorDashboard />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/:id" element={<ClientDetailPage />} />
          <Route path="transactions" element={<ExecutorTransactionsPage />} />
          <Route path="investments" element={<ExecutorInvestmentsPage />} />
          <Route path="loans" element={<ExecutorLoansPage />} />
          <Route path="positions" element={<ExecutorPositionsPage />} />
          <Route path="deposit-methods" element={<DepositMethodsPage />} />
          <Route path="withdrawal-methods" element={<WithdrawalMethodsPage />} />
          <Route path="wallets" element={<WalletsPage />} />
          <Route path="messages" element={<ExecutorMessagesPage />} />
          <Route path="inbox" element={<ResendInboxPage />} />
          <Route path="profile" element={<ExecutorProfilePage />} />
          <Route path="kyc" element={<KycReviewPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
