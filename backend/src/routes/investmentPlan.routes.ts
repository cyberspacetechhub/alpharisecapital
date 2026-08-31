import { Router } from "express";
import * as planController from "../controllers/investmentPlan.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { validate } from "../utils/validators/validate";
import { investmentPlanSchema } from "../utils/validators/plan.validator";

const router = Router();

router.use(protect);

// Executor — full management (must be before /:id to avoid route conflict)
router.get("/all", authorize("Executor"), planController.getAll);

// Trader — view active plans before investing
router.get("/", authorize("Trader"), planController.getActive);
router.get("/:id", authorize("Trader", "Executor"), planController.getOne);
router.post("/", authorize("Executor"), validate(investmentPlanSchema), planController.create);
router.patch("/:id", authorize("Executor"), planController.update);
router.patch("/:id/toggle", authorize("Executor"), planController.toggle);
router.delete("/:id", authorize("Executor"), planController.remove);

export default router;
