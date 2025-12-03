import SelfTransactionRepository from "@/app/repositories/selfTransaction/selfTransactionRepository";
import TransactionRepository from "@/app/repositories/transaction/transactionRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";
import prisma from "@/lib/prisma";
import { calculateFinancialYear } from "@/app/components/calculateFinYear/financialYear";

class SelfTransactionController {
  async readAll() {
    const cacheKey = "selfTransactions:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Self Transaction Cache Hit");
        return successResponse(JSON.parse(cachedData), "Success");
      }
      console.log("Self Transaction Cache Miss");
      const data = await SelfTransactionRepository.readAll();
      await RedisService.setex(cacheKey, 300, JSON.stringify(data));
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get all self transactions in Method: SelfTransactionController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readById(req) {
    try {
      const { searchParams } = new URL(req.url);
      const transaction_id = searchParams.get("transaction_id");

      if (!transaction_id) {
        const error = new Error("transaction_id is required");
        ErrorLogger.log(
          "Failed to get self transaction by id in Method: SelfTransactionController.readById",
          error
        );
        return errorResponse(error, 400);
      }

      const result = await SelfTransactionRepository.readById(transaction_id);
      if (!result) {
        ErrorLogger.log(
          "Failed to get self transaction by id in Method: SelfTransactionController.readById",
          new Error("Transaction not found")
        );
        return errorResponse(new Error("Transaction not found"), 404);
      }

      return successResponse(result, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get self transaction by id in Method: SelfTransactionController.readById",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async create(req) {
    try {
      const { req_object } = await req.json();
      const { transaction_date, account_id, amount, transaction_type } = req_object;

      if (!transaction_date || !account_id || !amount || !transaction_type) {
        const error = new Error(
          "transaction_date, account_id, amount, and transaction_type are required in Method: SelfTransactionController.create"
        );
        ErrorLogger.log(
          "Failed to create self transaction in Method: SelfTransactionController.create",
          error
        );
        return errorResponse(error, 400);
      }

      if (transaction_type !== "receive" && transaction_type !== "pay") {
        const error = new Error("transaction_type must be 'receive' or 'pay'");
        ErrorLogger.log(
          "Failed to create self transaction in Method: SelfTransactionController.create",
          error
        );
        return errorResponse(error, 400);
      }

      const amountValue = parseFloat(amount);
      if (amountValue <= 0) {
        const error = new Error("Amount must be greater than 0");
        ErrorLogger.log(
          "Failed to create self transaction in Method: SelfTransactionController.create",
          error
        );
        return errorResponse(error, 400);
      }

      const financialYear = calculateFinancialYear(transaction_date);
      const isReceive = transaction_type === "receive";

      // Use transaction to ensure both self_transaction and transaction are created together
      const result = await prisma.$transaction(async (tx) => {
        // Create the self transaction record
        const createdTransaction = await SelfTransactionRepository.create(
          {
            transaction_date,
            is_bank: req_object.is_bank || 0,
            account_id: Number(account_id),
            transaction_type,
            amount: amountValue,
            description: req_object.description || null,
            insert_by: req_object.insert_by || "user 1",
            update_by: req_object.update_by || "user 1",
            status: req_object.status ?? 1,
          },
          tx
        );

        // Create transaction entry
        // If receive: credit the account (money coming in)
        // If pay: debit the account (money going out)
        await TransactionRepository.create(
          {
            acc_id: Number(account_id),
            reference_id: createdTransaction.transaction_id,
            reference: "Self Transaction",
            debit: isReceive ? 0 : amountValue,
            credit: isReceive ? amountValue : 0,
            remarks: req_object.description || `${transaction_type === "receive" ? "Received" : "Paid"} ${isReceive ? "in" : "from"} own account`,
            financial_year: financialYear,
            voucher_type: "Self Transaction",
            transaction_dat: new Date(transaction_date),
            insert_by: req_object.insert_by || "user 1",
            update_by: req_object.update_by || "user 1",
          },
          tx
        );

        return createdTransaction;
      });

      await RedisService.del("selfTransactions:all");
      await RedisService.del("transactions:all");
      return successResponse(
        { transaction_id: result.transaction_id },
        "Self transaction created successfully"
      );
    } catch (err) {
      ErrorLogger.log(
        "Failed to create self transaction in Method: SelfTransactionController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { transaction_id } = req_object;

      if (!transaction_id) {
        const error = new Error(
          "transaction_id is required in Method: SelfTransactionController.update"
        );
        ErrorLogger.log(
          "Failed to update self transaction in Method: SelfTransactionController.update",
          error
        );
        return errorResponse(error, 400);
      }

      // Get existing transaction
      const existingTransaction = await SelfTransactionRepository.readById(transaction_id);
      if (!existingTransaction) {
        return errorResponse(new Error("Transaction not found"), 404);
      }

      const financialYear = req_object.transaction_date
        ? calculateFinancialYear(req_object.transaction_date)
        : calculateFinancialYear(existingTransaction.transaction_date);

      const transactionType = req_object.transaction_type || existingTransaction.transaction_type;
      const isReceive = transactionType === "receive";
      const amount = req_object.amount ? Number(req_object.amount) : existingTransaction.amount;
      const accountId = req_object.account_id ? Number(req_object.account_id) : existingTransaction.account_id;
      const transactionDate = req_object.transaction_date || existingTransaction.transaction_date;

      // Use transaction to ensure both self_transaction and transaction are updated together
      const result = await prisma.$transaction(async (tx) => {
        // Update the self transaction record
        const updatedTransaction = await SelfTransactionRepository.update(
          transaction_id,
          {
            ...req_object,
            account_id: req_object.account_id ? Number(req_object.account_id) : undefined,
            amount: req_object.amount ? Number(req_object.amount) : undefined,
            is_bank: req_object.is_bank !== undefined ? req_object.is_bank : undefined,
          },
          tx
        );

        // Delete old transaction
        await TransactionRepository.softDeleteByReferenceId(
          existingTransaction.transaction_id,
          "Self Transaction",
          tx
        );

        // Create new transaction
        await TransactionRepository.create(
          {
            acc_id: accountId,
            reference_id: updatedTransaction.transaction_id,
            reference: "Self Transaction",
            debit: isReceive ? 0 : amount,
            credit: isReceive ? amount : 0,
            remarks: req_object.description || `${transactionType === "receive" ? "Received" : "Paid"} ${isReceive ? "in" : "from"} own account`,
            financial_year: financialYear,
            voucher_type: "Self Transaction",
            transaction_dat: new Date(transactionDate),
            insert_by: req_object.update_by || "user 1",
            update_by: req_object.update_by || "user 1",
          },
          tx
        );

        return updatedTransaction;
      });

      await RedisService.del("selfTransactions:all");
      await RedisService.del("transactions:all");
      return successResponse(result, "Self transaction updated successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to update self transaction in Method: SelfTransactionController.update",
          err
        );
        return errorResponse(new Error("Transaction not found"), 404);
      }
      ErrorLogger.log(
        "Failed to update self transaction in Method: SelfTransactionController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async delete(req) {
    try {
      const { searchParams } = new URL(req.url);
      const transaction_id = searchParams.get("transaction_id");

      if (!transaction_id) {
        ErrorLogger.log(
          "Failed to delete self transaction in Method: SelfTransactionController.delete",
          new Error("transaction_id is required")
        );
        return errorResponse(new Error("transaction_id is required"), 400);
      }

      // Use transaction to ensure both self_transaction and transaction are deleted together
      await prisma.$transaction(async (tx) => {
        // Soft delete the self transaction
        await SelfTransactionRepository.delete(transaction_id);

        // Soft delete related transaction
        await TransactionRepository.softDeleteByReferenceId(
          Number(transaction_id),
          "Self Transaction",
          tx
        );
      });

      await RedisService.del("selfTransactions:all");
      await RedisService.del("transactions:all");
      return successResponse({}, "Self transaction deleted successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to delete self transaction in Method: SelfTransactionController.delete",
          err
        );
        return errorResponse(new Error("Transaction not found"), 404);
      }
      ErrorLogger.log(
        "Failed to delete self transaction in Method: SelfTransactionController.delete",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new SelfTransactionController();

