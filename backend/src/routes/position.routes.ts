import { Router } from "express";
import * as positionController from "../controllers/position.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { validate } from "../utils/validators/validate";
import { positionSchema } from "../utils/validators/plan.validator";

const router = Router();

router.use(protect);

// Trader
router.post("/", authorize("Trader"), validate(positionSchema), positionController.openPosition);
router.patch("/:id/close", authorize("Trader"), positionController.closeMyPosition);
router.get("/my", authorize("Trader"), positionController.getMyPositions);

// Executor
router.get("/all", authorize("Executor"), positionController.getAllPositions);
router.patch("/:id/force-close", authorize("Executor"), positionController.closePositionAsExecutor);

export default router;
