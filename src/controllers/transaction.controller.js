import transactionModel from "../models/transaction.model";
import ledgerModel from "../models/ledger.model";
import accountModel from "../models/account.model";
import mongoose from "mongoose";
import { sendTransactionEmail } from "../services/email.service";

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

  // check if the sender has sufficient balance to perform the transaction. We can calculate the sender's balance by aggregating the ledger entries for the sender's account and checking if the balance is greater than or equal to the transaction amount. If the sender does not have sufficient balance, we can return an error response indicating that the transaction cannot be processed due to insufficient funds.
  const senderBalance = await fromUserAccount.getBalance();

  if (senderBalance < amount) {
    return res.status(400).json({
      message: `Sender has insufficient balance. Transaction cannot be processed. Sender's balance is ${senderBalance}, but transaction amount is ${amount}`,
    });
  }

  // If all the above checks pass, we can proceed with creating the transaction. We can create a new transaction document in the transactions collection with the status set to "PENDING". We can also create corresponding ledger entries for the sender (DEBIT) and receiver (CREDIT) accounts. After successfully creating the transaction and ledger entries, we can update the transaction status to "COMPLETED" and return a success response with the transaction details.
  /*all steps should  be performed inside a MongoDB transaction session to ensure atomicity and consistency of the data. This means that if any step fails, the entire transaction can be rolled back to maintain data integrity. The steps are as follows:
   * 5. Create transaction (PENDING)
   * 6. Create DEBIT ledger entry
   * 7. Create CREDIT ledger entry
   * 8. Mark transaction COMPLETED
   */
  const session = await mongoose.startSession();
  session.startTransaction();

  const transaction = await transactionModel.create(
    {
      fromAccount,
      toAccount,
      amount,
      idempotencyKey,
      status: "PENDING",
    },
    { session },
  );

  const debitLedgerEntry = await ledgerModel.create(
    {
      account: fromAccount,
      type: "DEBIT",
      amount: amount,
      transaction: transaction._id,
    },
    { session },
  );
  const creditLedgerEntry = await ledgerModel.create(
    {
      account: toAccount,
      type: "CREDIT",
      amount: amount,
      transaction: transaction._id,
    },
    { session },
  );
  transaction.status = "COMPLETED";
  await transaction.save({ session });

  await session.commitTransaction();
  session.endSession();

  // finally we can send an email notification to both the sender and receiver about the transaction details. We can use a nodemailer transporter configured with Gmail API to send the emails. The email can include information such as the transaction amount, sender and receiver account details, and the transaction status.

  await sendTransactionEmail(
    req.user.email,
    req.user.name,
    amount,
    toUserAccount._id,
  );

  return res.status(201).json({
    message: "Transaction processed successfully",
    transaction: transaction,
  });
}

async function createInitialFundsTransactionController(req, res) {}

export { createTransactionController, createInitialFundsTransactionController };
