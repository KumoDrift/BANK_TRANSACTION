import mongoose from "mongoose";

//ledger is just a record of all the transactions that have happened in an account. It is used to keep track of the balance of an account and to generate statements for the account holder. Each ledger entry is associated with a transaction and contains the amount, type (credit or debit) and the account it belongs to.
// and one account has many ledger entries so we use indexing on the account field for faster queries when we want to get all the ledger entries for a specific account. This is important for generating statements and calculating the balance of an account efficiently.
const ledgerSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: [true, "Account is required for a ledger entry"],
      index: true, // Indexing for faster queries
      immutable: true, // Once set, the account reference cannot be changed for a ledger entry
    },
    amount: {
      type: Number,
      required: [true, "Amount is required for a ledger entry"],
      min: [0, "Ledger Amount cannot be negative"],
      immutable: true, // Once set, the amount cannot be changed for a ledger entry
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: [true, "Transaction reference is required for a ledger entry"],
      index: true, // Indexing for faster queries
      immutable: true, // Once set, the transaction reference cannot be changed for a ledger entry
    },
    type: {
      type: String,
      enum: {
        values: ["CREDIT", "DEBIT"],
        message: "Type can be either CREDIT or DEBIT",
      },
      required: [true, "Type is required for a ledger entry"],
      immutable: true, // Once set, the type cannot be changed for a ledger entry
    },
  },
  {
    timestamps: true,
  },
);

//we are doing this because we want to prevent any modification to the ledger entries once they are created. This is important for maintaining the integrity of the financial records and ensuring that the balance calculations are accurate. By throwing an error on any update or delete operation, we can ensure that the ledger entries remain immutable and reflect the true history of transactions for an account.
const preventLedgerModification = () => {
  throw new Error("Ledger entries cannot be modified once created");
};

ledgerSchema.pre("findOneAndDelete", preventLedgerModification);
ledgerSchema.pre("findOneAndUpdate", preventLedgerModification);
ledgerSchema.pre("updateOne", preventLedgerModification);
ledgerSchema.pre("deleteOne", preventLedgerModification);
ledgerSchema.pre("findOneAndRemove", preventLedgerModification);
ledgerSchema.pre("remove", preventLedgerModification);
ledgerSchema.pre("updateMany", preventLedgerModification);
ledgerSchema.pre("deleteMany", preventLedgerModification);

const ledgerModel = mongoose.model("Ledger", ledgerSchema);

export default ledgerModel;
