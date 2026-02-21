import mongoose from "mongoose";
import LedgerModel from "./ledger.model.js";

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Account must be associated with a user"],
      index: true, // Indexing for faster queries
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "FROZEN", "CLOSED"],
        message: "Status can be either ACTIVE, FROZEN or CLOSED",
      },
      default: "ACTIVE",
    },
    currency: {
      type: String,
      required: [true, "Currency is required for creating an account"],
      default: "INR",
    },
  },
  {
    timestamps: true,
  },
);

accountSchema.index({ user: 1, status: 1 }); // Indexing the user field for faster lookups

accountSchema.methods.getBalance = async function () {
  //this aggregation pipeline calculates the balance for the account by summing up all the CREDIT entries and subtracting all the DEBIT entries from the ledger collection. The result is returned as the balance for the account.and this is a special feature of mongoose which allows us to define custom methods on our schema which can be called on the instances of the model. In this case, we are defining a method called getBalance which can be called on any account instance to get the current balance of that account.
  const balanceData = await LedgerModel.aggregate([
    { $match: { account: this._id } },
    {
      $group: {
        _id: null,
        totalDebit: {
          $sum: {
            $cond: [{ $eq: ["$type", "DEBIT"] }, "$amount", 0],
          },
        },
        totalCredit: {
          $sum: {
            $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        balance: { $subtract: ["$totalCredit", "$totalDebit"] },
      },
    },
  ]);

  if (balanceData.length === 0) {
    return 0;
  }

  return balanceData[0].balance;
};

const accountModel = mongoose.model("account", accountSchema);

export default accountModel;
