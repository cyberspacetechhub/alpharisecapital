import { Router } from "express";
import * as txController from "../controllers/transaction.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { validate } from "../utils/validators/validate";
import { depositSchema, withdrawalSchema } from "../utils/validators/transaction.validator";

const router = Router();

router.use(protect);

// Trader
router.post("/deposit", authorize("Trader"), validate(depositSchema), txController.deposit);
router.post("/withdraw", authorize("Trader"), validate(withdrawalSchema), txController.withdraw);
router.get("/my", authorize("Trader"), txController.getMyTransactions);

// Executor
router.get("/all", authorize("Executor"), txController.getAllTransactions);
router.patch("/deposit/:id/approve", authorize("Executor"), txController.approveDeposit);
router.patch("/deposit/:id/reject", authorize("Executor"), txController.rejectDeposit);
router.patch("/withdrawal/:id/approve", authorize("Executor"), txController.approveWithdrawal);
router.patch("/withdrawal/:id/reject", authorize("Executor"), txController.rejectWithdrawal);

export default router;
