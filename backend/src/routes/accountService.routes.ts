import { Router } from "express";
import * as controller from "../controllers/accountService.controller";
import { protect, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.use(protect);

// ── Trader ──
router.get("/my-active", authorize("Trader"), controller.getMyActiveServices);

// ── Executor (Admin) ──
router.get("/all", authorize("Executor"), controller.getAllAccountServices);
router.get("/user/:userId", authorize("Executor"), controller.getUserAccountServices);
router.get("/client-active-plan/:userId", authorize("Executor"), controller.getClientActivePlan);
router.post("/create", authorize("Executor"), controller.createAccountService);
router.patch("/:id/resolve", authorize("Executor"), controller.markServiceResolved);

export default router;
