import express from "express";
import * as accountController from "../controllers/account.controller.js";
import * as authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * - POST /api/accounts/
 * - Create a new account
 * - Protected Route
 */
router.post(
  "/",
  authMiddleware.authMiddleware,
  accountController.createAccountController,
);

export default router;
