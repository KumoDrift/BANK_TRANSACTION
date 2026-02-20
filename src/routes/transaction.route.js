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

export default router;
