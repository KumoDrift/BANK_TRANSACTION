import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: [true, "From account is required for a transaction"],
      index: true, // Indexing for faster queries
    },
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: [true, "To account is required for a transaction"],
      index: true, // Indexing for faster queries
    },
    status: {
      type: String,
      enum: {
        values: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
        message: "Status can be either PENDING, COMPLETED, FAILED or REVERSED",
      },
      default: "PENDING",
    },
    amount: {
      type: Number,
      required: [true, "Amount is required for a transaction"],
      min: [0, "Transaction Amount cannot be negative"],
    },
    //IT prevents duplicate transactions in case of network issues or retries from the client side
    //Alwasys generate a unique idempotency key on the client side for each transaction request and pass it in the request body
    //IT never repeats
    idempotencyKey: {
      type: String,
      required: [true, "Idempotency key is required for a transaction"],
      unique: true,
      index: true, // Indexing for faster lookups
    },
  },
  {
    timestamps: true,
  },
);

const transactionModel = mongoose.model("Transaction", transactionSchema);

export default transactionModel;
