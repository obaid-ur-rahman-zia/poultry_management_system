import OppositeTransactionRepository from "@/app/repositories/oppositeTransaction/oppositeTransactionRepository";
import TransactionRepository from "@/app/repositories/transaction/transactionRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import prisma from "@/lib/prisma";
import { calculateFinancialYear } from "@/app/components/calculateFinYear/financialYear";
import RedisService from "@/app/utils/redis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { generateBalanceSheetReportPDF } from "@/app/utils/pdfGenerators/balanceSheetReport";

class OppositeTransactionController {
  async readAll(req) {
    try {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id?.toString();
      const role = session?.user?.role;

      // Extract pagination params
      const searchParams =
        req?.nextUrl?.searchParams || new URL(req?.url || "").searchParams;
      const getAll = searchParams.get("all") === "true";
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "20");
      const date = searchParams.get("date");
      const skip = (page - 1) * limit;

      const insertBy = (role === "USER" && userId) ? userId : null;

      // If getAll is true, fetch all opposite transactions without pagination
      let data, total;
      if (getAll) {
        data = await OppositeTransactionRepository.readAll(date, insertBy);
        total = data.length;
      } else {
        // Get total count and paginated opposite transactions
        const result =
          await OppositeTransactionRepository.readAllWithPagination(
            skip,
            limit,
            date,
            insertBy
          );
        data = result.data;
        total = result.total;
      }

      // If getAll, return all opposite transactions without pagination structure
      if (getAll) {
        const response = { data };
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

      return successResponse(paginatedResponse, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get all opposite transactions in Method: OppositeTransactionController.readAll",
        err,
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
          "Failed to get opposite transaction by id in Method: OppositeTransactionController.readById",
          error,
        );
        return errorResponse(error, 400);
      }

      const result =
        await OppositeTransactionRepository.readById(transaction_id);
      if (!result) {
        ErrorLogger.log(
          "Failed to get opposite transaction by id in Method: OppositeTransactionController.readById",
          new Error("Transaction not found"),
        );
        return errorResponse(new Error("Transaction not found"), 404);
      }

      return successResponse(result, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get opposite transaction by id in Method: OppositeTransactionController.readById",
        err,
      );
      return errorResponse(err, 500);
    }
  }

  async create(req) {
    try {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id?.toString() || "user 1";

      const { req_object } = await req.json();
      
      req_object.insert_by = req_object.insert_by || userId;
      req_object.update_by = req_object.update_by || userId;

      const { transaction_date, paid_by, received_by, amount, bank_account } =
        req_object;

      if (!transaction_date || !paid_by || !received_by || !amount) {
        const error = new Error(
          "transaction_date, paid_by, received_by, and amount are required in Method: OppositeTransactionController.create",
        );
        ErrorLogger.log(
          "Failed to create opposite transaction in Method: OppositeTransactionController.create",
          error,
        );
        return errorResponse(error, 400);
      }

      if (paid_by === received_by) {
        const error = new Error(
          "Paid by and received by cannot be the same account",
        );
        ErrorLogger.log(
          "Failed to create opposite transaction in Method: OppositeTransactionController.create",
          error,
        );
        return errorResponse(error, 400);
      }

      const amountValue = parseFloat(amount);
      if (amountValue <= 0) {
        const error = new Error("Amount must be greater than 0");
        ErrorLogger.log(
          "Failed to create opposite transaction in Method: OppositeTransactionController.create",
          error,
        );
        return errorResponse(error, 400);
      }

      // Get bank account name if provided
      let bankAccountName = "";
      if (bank_account) {
        const bankAcc = await prisma.accounts.findUnique({
          where: { acc_id: Number(bank_account) },
          select: { account_nam: true },
        });
        if (bankAcc) {
          bankAccountName = bankAcc.account_nam;
        }
      }

      // Create description with bank name prefix if bank account is selected
      const description = bankAccountName
        ? `${bankAccountName} - ${req_object.description || ""}`.trim()
        : req_object.description || "";

      const financialYear = calculateFinancialYear(transaction_date);

      // Use transaction to ensure both opposite_transaction and transactions are created together
      const result = await prisma.$transaction(async (tx) => {
        // Create the opposite transaction record
        const createdTransaction = await OppositeTransactionRepository.create(
          {
            transaction_date,
            paid_by: Number(paid_by),
            bank_account: bank_account ? Number(bank_account) : null,
            received_by: Number(received_by),
            amount: amountValue,
            description,
            insert_by: req_object.insert_by || "user 1",
            update_by: req_object.update_by || "user 1",
            status: req_object.status ?? 1,
          },
          tx,
        );

        // Create two transactions: debit for paid_by, credit for received_by
        const referenceId = createdTransaction.transaction_id;

        // Debit transaction for paid_by account
        await TransactionRepository.create(
          {
            acc_id: Number(paid_by),
            reference_id: referenceId,
            reference: "Opposite Transaction",
            credit: amountValue,
            debit: 0,
            remarks: description,
            financial_year: financialYear,
            voucher_type: "OT",
            transaction_dat: new Date(transaction_date),
            insert_by: req_object.insert_by || "user 1",
            update_by: req_object.update_by || "user 1",
          },
          tx,
        );

        // Credit transaction for received_by account
        await TransactionRepository.create(
          {
            acc_id: Number(received_by),
            reference_id: referenceId,
            reference: "Opposite Transaction",
            credit: 0,
            debit: amountValue,
            remarks: description,
            financial_year: financialYear,
            voucher_type: "OT",
            transaction_dat: new Date(transaction_date),
            insert_by: req_object.insert_by || "user 1",
            update_by: req_object.update_by || "user 1",
          },
          tx,
        );

        return createdTransaction;
      });

      return successResponse(
        { transaction_id: result.transaction_id },
        "Opposite transaction created successfully",
      );
    } catch (err) {
      ErrorLogger.log(
        "Failed to create opposite transaction in Method: OppositeTransactionController.create",
        err,
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id?.toString() || "user 1";

      const { req_object } = await req.json();
      const { transaction_id } = req_object;
      
      req_object.update_by = req_object.update_by || userId;

      if (!transaction_id) {
        const error = new Error(
          "transaction_id is required in Method: OppositeTransactionController.update",
        );
        ErrorLogger.log(
          "Failed to update opposite transaction in Method: OppositeTransactionController.update",
          error,
        );
        return errorResponse(error, 400);
      }

      // Get existing transaction
      const existingTransaction =
        await OppositeTransactionRepository.readById(transaction_id);
      if (!existingTransaction) {
        return errorResponse(new Error("Transaction not found"), 404);
      }

      // Get bank account name if provided
      let bankAccountName = "";
      if (req_object.bank_account) {
        const bankAcc = await prisma.accounts.findUnique({
          where: { acc_id: Number(req_object.bank_account) },
          select: { account_nam: true },
        });
        if (bankAcc) {
          bankAccountName = bankAcc.account_nam;
        }
      }

      // Create description with bank name prefix if bank account is selected
      const description = bankAccountName
        ? `${bankAccountName} - ${req_object.description || ""}`.trim()
        : req_object.description || "";

      const financialYear = req_object.transaction_date
        ? calculateFinancialYear(req_object.transaction_date)
        : calculateFinancialYear(existingTransaction.transaction_date);

      // Use transaction to ensure both opposite_transaction and transactions are updated together
      const result = await prisma.$transaction(async (tx) => {
        // Update the opposite transaction record
        const updatedTransaction = await OppositeTransactionRepository.update(
          transaction_id,
          {
            ...req_object,
            description,
            paid_by: req_object.paid_by
              ? Number(req_object.paid_by)
              : undefined,
            received_by: req_object.received_by
              ? Number(req_object.received_by)
              : undefined,
            bank_account:
              req_object.bank_account !== undefined
                ? req_object.bank_account
                  ? Number(req_object.bank_account)
                  : null
                : undefined,
            amount: req_object.amount ? Number(req_object.amount) : undefined,
          },
          tx,
        );

        // Delete old transactions
        await TransactionRepository.softDeleteByReferenceId(
          existingTransaction.transaction_id,
          "Opposite Transaction",
          tx,
        );

        // Create new transactions
        const paidBy = req_object.paid_by
          ? Number(req_object.paid_by)
          : existingTransaction.paid_by;
        const receivedBy = req_object.received_by
          ? Number(req_object.received_by)
          : existingTransaction.received_by;
        const amount = req_object.amount
          ? Number(req_object.amount)
          : existingTransaction.amount;
        const transactionDate =
          req_object.transaction_date || existingTransaction.transaction_date;

        // Transaction for paid_by account (Credit)
        await TransactionRepository.create(
          {
            acc_id: paidBy,
            reference_id: updatedTransaction.transaction_id,
            reference: "Opposite Transaction",
            credit: amount,
            debit: 0,
            remarks: description,
            financial_year: financialYear,
            voucher_type: "OT",
            transaction_dat: new Date(transactionDate),
            insert_by: req_object.update_by || "user 1",
            update_by: req_object.update_by || "user 1",
          },
          tx,
        );

        // Transaction for received_by account (Debit)
        await TransactionRepository.create(
          {
            acc_id: receivedBy,
            reference_id: updatedTransaction.transaction_id,
            reference: "Opposite Transaction",
            credit: 0,
            debit: amount,
            remarks: description,
            financial_year: financialYear,
            voucher_type: "OT",
            transaction_dat: new Date(transactionDate),
            insert_by: req_object.update_by || "user 1",
            update_by: req_object.update_by || "user 1",
          },
          tx,
        );

        return updatedTransaction;
      });

      await RedisService.del("oppositeTransactions:all");
      await RedisService.del("transactions:all");
      return successResponse(
        result,
        "Opposite transaction updated successfully",
      );
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to update opposite transaction in Method: OppositeTransactionController.update",
          err,
        );
        return errorResponse(new Error("Transaction not found"), 404);
      }
      ErrorLogger.log(
        "Failed to update opposite transaction in Method: OppositeTransactionController.update",
        err,
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
          "Failed to delete opposite transaction in Method: OppositeTransactionController.delete",
          new Error("transaction_id is required"),
        );
        return errorResponse(new Error("transaction_id is required"), 400);
      }

      // Use transaction to ensure both opposite_transaction and transactions are deleted together
      await prisma.$transaction(async (tx) => {
        // Soft delete the opposite transaction
        await OppositeTransactionRepository.delete(transaction_id);

        // Soft delete related transactions
        await TransactionRepository.softDeleteByReferenceId(
          Number(transaction_id),
          "Opposite Transaction",
          tx,
        );
      });

      return successResponse({}, "Opposite transaction deleted successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to delete opposite transaction in Method: OppositeTransactionController.delete",
          err,
        );
        return errorResponse(new Error("Transaction not found"), 404);
      }
      ErrorLogger.log(
        "Failed to delete opposite transaction in Method: OppositeTransactionController.delete",
        err,
      );
      return errorResponse(err, 500);
    }
  }

  async readBalanceSheet(req) {
    try {
      const { searchParams } = new URL(req.url);
      const start_date = searchParams.get("start_date");
      const end_date = searchParams.get("end_date");
      const acc_id = searchParams.get("acc_id");

      if (!start_date || !end_date) {
        const error = new Error("start_date and end_date are required");
        ErrorLogger.log(
          "Failed to get balance sheet in Method: OppositeTransactionController.readBalanceSheet",
          error,
        );
        return errorResponse(error, 400);
      }

      // Find the user who owns this cash-in-hand account
      // Each user has their own cash_in_hand_account_id, so we can look up who owns this account
      // and filter all transactions by that user's insert_by
      const ownerUser = await prisma.user.findFirst({
        where: { cash_in_hand_account_id: parseInt(acc_id) },
        select: { user_id: true },
      });

      // If no user owns this account, insertBy is null → repository returns all transactions unfiltered
      const insertBy = ownerUser ? ownerUser.user_id.toString() : null;

      // Get opening balance (before start date) for the specific cash account
      const openingBalance = await TransactionRepository.readOpeningBalance({
        acc_id: parseInt(acc_id),
        start_dat: start_date,
      });

      // Get closing balance (up to and including end date) for the specific cash account
      const closingBalance = await TransactionRepository.readClosingBalance({
        acc_id: parseInt(acc_id),
        end_dat: end_date,
      });

      // Get all transactions within the date range, filtered by the account owner
      const transactions = await OppositeTransactionRepository.readBalanceSheet(
        start_date,
        end_date,
        parseInt(acc_id),
        insertBy
      );

      return successResponse(
        {
          openingBalance,
          closingBalance,
          transactions,
        },
        "Balance sheet retrieved successfully",
      );
    } catch (err) {
      ErrorLogger.log(
        "Failed to get balance sheet in Method: OppositeTransactionController.readBalanceSheet",
        err,
      );
      return errorResponse(err, 500);
    }
  }

  async downloadBalanceSheet(req) {
    try {
      const { searchParams } = new URL(req.url);
      const start_date = searchParams.get("start_date");
      const end_date = searchParams.get("end_date");
      const acc_id = searchParams.get("acc_id");

      if (!start_date || !end_date) {
        return NextResponse.json(
          { error: "start_date and end_date are required" },
          { status: 400 }
        );
      }

      // Find the user who owns this cash-in-hand account
      const ownerUser = await prisma.user.findFirst({
        where: { cash_in_hand_account_id: parseInt(acc_id) },
        select: { user_id: true },
      });

      const insertBy = ownerUser ? ownerUser.user_id.toString() : null;

      // Get opening balance
      const openingBalance = await TransactionRepository.readOpeningBalance({
        acc_id: parseInt(acc_id),
        start_dat: start_date,
      });

      // Get closing balance
      const closingBalance = await TransactionRepository.readClosingBalance({
        acc_id: parseInt(acc_id),
        end_dat: end_date,
      });

      // Get transactions
      const transactions = await OppositeTransactionRepository.readBalanceSheet(
        start_date,
        end_date,
        parseInt(acc_id),
        insertBy
      );

      // Generate PDF
      const pdfBuffer = await generateBalanceSheetReportPDF(
        transactions,
        openingBalance,
        closingBalance,
        start_date,
        end_date
      );
      
      const uint8Array = new Uint8Array(pdfBuffer);

      // Return PDF as download
      return new NextResponse(uint8Array, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="Balance_Sheet_${start_date}_to_${end_date}.pdf"`,
          "Content-Length": pdfBuffer.length.toString(),
        },
      });
    } catch (error) {
      console.error("PDF Generation Error:", error);
      return NextResponse.json(
        { error: "Failed to generate PDF", details: error.message },
        { status: 500 }
      );
    }
  }
}

export default new OppositeTransactionController();
