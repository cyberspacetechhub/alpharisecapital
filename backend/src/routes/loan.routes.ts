import { Router } from "express";
import * as loanController from "../controllers/loan.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { validate } from "../utils/validators/validate";
import { loanOfferSchema, loanApplicationSchema, upgradeLoanLimitSchema, updateGeneralLoanLimitSchema } from "../utils/validators/plan.validator";

const router = Router();

router.use(protect);

// Trader
router.get("/offers", authorize("Trader"), loanController.getActiveOffers);
router.post("/apply", authorize("Trader"), validate(loanApplicationSchema), loanController.applyForLoan);
router.post("/repay/:id", authorize("Trader"), loanController.repayLoan);
router.get("/my", authorize("Trader"), loanController.getMyLoans);

// Executor
router.get("/offers/all", authorize("Executor"), loanController.getAllOffers);
router.post("/offers", authorize("Executor"), validate(loanOfferSchema), loanController.createOffer);
router.patch("/offers/:id/toggle", authorize("Executor"), loanController.toggleOffer);
router.get("/applications", authorize("Executor"), loanController.getAllApplications);
router.patch("/applications/:id/approve", authorize("Executor"), loanController.approveLoan);
router.patch("/applications/:id/reject", authorize("Executor"), loanController.rejectLoan);
router.patch("/limit", authorize("Executor"), validate(upgradeLoanLimitSchema), loanController.upgradeUserLoanLimit);
router.get("/general-limit", authorize("Executor"), loanController.getGeneralLimit);
router.patch("/general-limit", authorize("Executor"), validate(updateGeneralLoanLimitSchema), loanController.updateGeneralLimit);

export default router;
