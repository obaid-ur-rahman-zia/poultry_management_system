import SelfTransactionRepository from "@/app/repositories/selfTransaction/selfTransactionRepository";
import TransactionRepository from "@/app/repositories/transaction/transactionRepository";
import AccountsRepository from "@/app/repositories/account/accounts/accountsRepository";
import AccountSubHeadRepository from "@/app/repositories/account/accountSubHead/accountSubHeadRepository";
import UserRepository from "@/app/repositories/user/userRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";
import prisma from "@/lib/prisma";
import { calculateFinancialYear } from "@/app/components/calculateFinYear/financialYear";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

class SelfTransactionController {
  async readAll(req) {
    const cacheKey = "selfTransactions:all";
    try {
      // Extract pagination params
      const searchParams = req?.nextUrl?.searchParams || new URL(req?.url || "").searchParams;
      const getAll = searchParams.get("all") === "true";
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const skip = (page - 1) * limit;

      // If getAll is true, fetch all self transactions without pagination
      let data, total;
      if (getAll) {
        data = await SelfTransactionRepository.readAll();
        total = data.length;
      } else {
        // Get total count and paginated self transactions
        const result = await SelfTransactionRepository.readAllWithPagination(skip, limit);
        data = result.data;
        total = result.total;
      }

      // Use cache key with pagination to avoid cache conflicts
      const userCacheKey = getAll
        ? `${cacheKey}:all`
        : `${cacheKey}:page:${page}:limit:${limit}`;

      const cachedData = await RedisService.get(userCacheKey);
      if (cachedData) {
        console.log("Self Transaction Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Self Transaction Cache Miss");

      // If getAll, return all self transactions without pagination structure
      if (getAll) {
        const response = { data };
        await RedisService.setex(userCacheKey, 300, JSON.stringify(response));
        return successResponse(response, "Success");
      }

      const paginatedResponse = {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      await RedisService.setex(userCacheKey, 300, JSON.stringify(paginatedResponse));
      return successResponse(paginatedResponse, "Success");
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
      // Get logged-in user session
      const session = await getServerSession(authOptions);
      if (!session || !session.user?.id) {
        return errorResponse(new Error("Unauthorized: User must be logged in"), 401);
      }

      const userId = parseInt(session.user.id);
      
      // Get user with cash in hand account
      const user = await UserRepository.readById(userId);
      if (!user) {
        return errorResponse(new Error("User not found"), 404);
      }

      // Validate that user has cash in hand account
      if (!user.cash_in_hand_account || !user.cash_in_hand_account_id) {
        return errorResponse(
          new Error("User must have a Cash In Hand account. Please contact administrator."),
          400
        );
      }

      const { req_object } = await req.json();
      const { transaction_date, account_id, amount, transaction_type } = req_object;

      console.log("=== SELF TRANSACTION CREATE ===");
      console.log("Raw transaction_type from request:", transaction_type);
      console.log("Type of transaction_type:", typeof transaction_type);

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

      // Normalize transaction type first to handle case variations
      const normalizedTransactionType = String(transaction_type).toLowerCase().trim();
      console.log("Normalized transaction_type:", normalizedTransactionType);
      
      if (normalizedTransactionType !== "receive" && normalizedTransactionType !== "pay") {
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
      const cashInHandAccountId = user.cash_in_hand_account_id;
      const isReceive = normalizedTransactionType === "receive";
      const isPay = normalizedTransactionType === "pay";
      

      // Use transaction to ensure both self_transaction and transactions are created together
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

        // Create transaction entry for the selected account
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
            voucher_type: "ST",
            transaction_dat: new Date(transaction_date),
            insert_by: req_object.insert_by || "user 1",
            update_by: req_object.update_by || "user 1",
          },
          tx
        );

        // Create opposite transaction in user's cash in hand account
        // If receive: debit cash in hand (money going out from cash)
        // If pay: credit cash in hand (money coming into cash)
        await TransactionRepository.create(
          {
            acc_id: cashInHandAccountId,
            reference_id: createdTransaction.transaction_id,
            reference: "Self Transaction",
            debit: isReceive ? amountValue : 0,
            credit: isReceive ? 0 : amountValue,
            remarks: req_object.description || `Opposite transaction: ${transaction_type === "receive" ? "Paid from" : "Received in"} cash in hand`,
            financial_year: financialYear,
            voucher_type: "ST",
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
      // Get logged-in user session
      const session = await getServerSession(authOptions);
      if (!session || !session.user?.id) {
        return errorResponse(new Error("Unauthorized: User must be logged in"), 401);
      }

      const userId = parseInt(session.user.id);
      
      // Get user with cash in hand account
      const user = await UserRepository.readById(userId);
      if (!user) {
        return errorResponse(new Error("User not found"), 404);
      }

      // Validate that user has cash in hand account
      if (!user.cash_in_hand_account || !user.cash_in_hand_account_id) {
        return errorResponse(
          new Error("User must have a Cash In Hand account. Please contact administrator."),
          400
        );
      }

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
      const normalizedTransactionType = String(transactionType).toLowerCase().trim();
      const isReceive = normalizedTransactionType === "receive";
      const isPay = normalizedTransactionType === "pay";
      const amount = req_object.amount ? Number(req_object.amount) : existingTransaction.amount;
      const accountId = req_object.account_id ? Number(req_object.account_id) : existingTransaction.account_id;
      const transactionDate = req_object.transaction_date || existingTransaction.transaction_date;
      const cashInHandAccountId = user.cash_in_hand_account_id;


      // Use transaction to ensure both self_transaction and transactions are updated together
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

        // Delete old transactions (both account and cash in hand)
        await TransactionRepository.softDeleteByReferenceId(
          existingTransaction.transaction_id,
          "Self Transaction",
          tx
        );

        // Create new transaction for the selected account
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

        // Create opposite transaction in user's cash in hand account
        await TransactionRepository.create(
          {
            acc_id: cashInHandAccountId,
            reference_id: updatedTransaction.transaction_id,
            reference: "Self Transaction",
            debit: isReceive ? amount : 0,
            credit: isReceive ? 0 : amount,
            remarks: req_object.description || `Opposite transaction: ${transactionType === "receive" ? "Paid from" : "Received in"} cash in hand`,
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

      // Use transaction to ensure both self_transaction and transactions are deleted together
      await prisma.$transaction(async (tx) => {
        // Soft delete the self transaction
        await SelfTransactionRepository.delete(transaction_id);

        // Soft delete related transactions (both account and cash in hand)
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

