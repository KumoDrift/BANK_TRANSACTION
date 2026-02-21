import express from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import * as transactionController from "../controllers/transaction.controller.js";
const router = express.Router();

/**
 * - POST /api/transactions/
 * - Create a new transaction
 */
router.post(
  "/",
  authMiddleware,
  transactionController.createTransactionController,
);

/**
 * - POST /api/transactions/system/initial-funds
 * - Create initial funds transaction from system user
 */

router.post(
  "/system/initial-funds",
  authMiddleware,
  transactionController.createInitialFundsTransactionController,
);

export default router;
