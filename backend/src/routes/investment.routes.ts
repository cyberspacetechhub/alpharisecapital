import { Router } from "express";
import * as investController from "../controllers/investment.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { validate } from "../utils/validators/validate";
import { upgradePlanSchema } from "../utils/validators/plan.validator";
import { investmentSchema } from "../utils/validators/transaction.validator";

const router = Router();

router.use(protect);

// Trader
router.post("/invest", authorize("Trader"), validate(investmentSchema), investController.invest);
router.post("/reinvest/:transactionId", authorize("Trader"), investController.reinvest);
router.patch("/upgrade/:transactionId", authorize("Trader"), validate(upgradePlanSchema), investController.upgradePlan);
router.get("/my", authorize("Trader"), investController.getMyInvestments);

// Executor
router.get("/all", authorize("Executor"), investController.getAllInvestments);
router.post("/:id/profit", authorize("Executor"), investController.logProfit);
router.patch("/:id/status", authorize("Executor"), investController.updateInvestmentStatus);
router.patch("/upgrade-executor/:transactionId", authorize("Executor"), validate(upgradePlanSchema), investController.upgradePlanExecutor);
router.patch("/:id/approve", authorize("Executor"), investController.approveInvestment);
router.patch("/:id/reject", authorize("Executor"), investController.rejectInvestment);

export default router;
