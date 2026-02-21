import transactionModel from "../models/transaction.model";
import ledgerModel from "../models/ledger.model";
import accountModel from "../models/account.model";

/**
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW:
 * 1. Validate request
 * 2. Validate idempotency key
 * 3. Check account status
 * 4. Derive sender balance from ledger
 * 5. Create transaction (PENDING)
 * 6. Create DEBIT ledger entry
 * 7. Create CREDIT ledger entry
 * 8. Mark transaction COMPLETED
 * 9. Commit MongoDB session
 * 10. Send email notification
 */

async function createTransactionController(req, res) {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message:
        "Missing required fields: fromAccount, toAccount, amount, idempotencyKey",
    });
  }

  //chechking if the accounts which are gonna take part in transaction are really present in our database or not
  const fromUserAccount = await accountModel.findOne({
    _id: fromAccount,
  });
  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });

  if (!fromUserAccount || !toUserAccount) {
    return res.status(404).json({
      message:
        "One or both accounts are not present in our system which means transaction cannot be processed",
    });
  }

  //checking if the transaction with the same idempotency key has already been processed or not. This is important to prevent duplicate transactions in case of network issues or retries from the client side. If a transaction with the same idempotency key is found, we can return an error response indicating that the transaction has already been processed.
  const isTransactionAlreadyProcessed = await transactionModel.findOne({
    idempotencyKey: idempotencyKey,
  });

  if (isTransactionAlreadyProcessed) {
    if (isTransactionAlreadyProcessed.status === "COMPLETED") {
      return res.status(200).json({
        message: "Transaction has already been processed successfully",
        transaction: isTransactionAlreadyProcessed,
      });
    }
    if (isTransactionAlreadyProcessed.status === "PENDING") {
      return res.status(200).json({
        message: "Transaction is  in process",
      });
    }
    if (isTransactionAlreadyProcessed.status === "FAILED") {
      return res.status(500).json({
        message: "Transaction processing failed , Retry after some time",
      });
    }
    if (isTransactionAlreadyProcessed.status === "REVERSED") {
      return res.status(500).json({
        message: "Transaction has been reversed , Retry after some time",
      });
    }
  }

  //checking if the accounts are active or not. If any of the accounts is inactive, we cannot process the transaction and we can return an error response indicating that the transaction cannot be processed due to account status.

  if (
    fromUserAccount.status !== "ACTIVE" ||
    toUserAccount.status !== "ACTIVE"
  ) {
    return res.status(400).json({
      message:
        "One or both accounts are not active. Transaction cannot be processed",
    });
  }
}

async function createInitialFundsTransactionController(req, res) {}

export { createTransactionController, createInitialFundsTransactionController };
