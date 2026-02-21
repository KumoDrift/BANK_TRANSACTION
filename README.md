# 💸 Bank Transaction System (Ledger-Based)

A production-style backend system that simulates **real-world banking transactions** using **Node.js, Express, MongoDB, and Mongoose**.

Built with a focus on **data integrity, idempotency, and ledger-based accounting**.

---

## 🚀 Features

- 🔐 Account & Authentication system
- 💰 Ledger-based balance calculation
- 🔁 Idempotent transactions (no double debit)
- 🔄 Atomic MongoDB transactions
- 📒 Immutable ledger entries
- 📩 Email notifications for transactions

---

## 🧠 Core Concept

Instead of storing balance directly, this system uses a **ledger**:

- Each transfer creates **2 entries**
  - DEBIT → sender
  - CREDIT → receiver

**Balance = total credits - total debits**

---

## 🔄 Transaction Flow

1. Validate request
2. Check idempotency key
3. Verify account & balance
4. Create transaction (PENDING)
5. Create DEBIT & CREDIT ledger entries
6. Mark transaction COMPLETED
7. Commit DB session
8. Send email notification

---

## 🧱 Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- Nodemailer

---

## 📁 Structure

models/
controllers/
routes/
middleware/
services/
config/

---

## 🛡️ Key Guarantees

✔ No duplicate transactions  
✔ Accurate balance calculation  
✔ Immutable financial records  
✔ Safe retry with idempotency key

---

## 🌍 Real-World Use

Inspired by how **banking systems, UPI, and payment gateways** handle transactions internally.

---

## 👨‍💻 Author 🌸 KUMODRIFT

Built as part of a **DevOps + Backend Engineering Journey** 🚀
