import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import VoucherRepository from "@/app/repositories/voucher/voucherRepository";
import transactionRepository from "@/app/repositories/transaction/transactionRepository";
import RedisService from "@/app/utils/redis";

class TransactionController {
  async readAll(req) {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "100");
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");
      const voucherType = searchParams.get("voucherType");
      const financialYear = searchParams.get("financialYear");

      const { data, totalCount } = await transactionRepository.readAll({
        page,
        limit,
        startDate,
        endDate,
        voucherType,
        financialYear,
      });

      return successResponse(
        {
          data,
          pagination: {
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            itemsPerPage: limit,
          },
        },
        "Success",
      );
    } catch (err) {
      ErrorLogger.log(
        "Failed to get transactions in Method: transactionController.readAll",
        err,
      );
      return errorResponse(err, 500);
    }
  }

  async readAccountLedger(req) {
    try {
      const { searchParams } = new URL(req.url);
      const start_dat = searchParams.get("start_dat");
      const end_dat = searchParams.get("end_dat");
      const end = new Date(end_dat);
      end.setHours(23, 59, 59, 999);

      const acc_id = searchParams.get("acc_id");

      if (!start_dat || !end_dat || !acc_id) {
        ErrorLogger.log(
          "Missing start_dat, end_dat or acc_id Parameeter: TransactionController.readAccountLedger",
          "error",
        );
        return errorResponse("error", 400);
      }
      const data = await transactionRepository.readAccountLedger({
        acc_id,
        start_dat,
        end,
      });
      const openingBalance = await transactionRepository.readOpeningBalance({
        acc_id,
        start_dat,
      });

      return successResponse(
        {
          data,
          openingBalance,
        },
        "Success",
      );
    } catch (err) {
      ErrorLogger.log(
        "Failed to get transactions in Method: transactionController.readAccountLedger",
        err,
      );
      return errorResponse(err, 500);
    }
  }
  async readLastTransaction(req) {
    try {
      const { searchParams } = new URL(req.url);
      const acc_id = searchParams.get("acc_id");

      if (!acc_id) {
        const error = new Error("acc_id is required");
        ErrorLogger.log(
          "Failed to get transactions in Method: transactionController.readLastTransaction",
          error,
        );
        return errorResponse(error, 400);
      }

      const data = await transactionRepository.readLastTransaction({
        acc_id,
      });

      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get transactions in Method: transactionController.readLastTransaction",
        err,
      );
      return errorResponse(err, 500);
    }
  }

  async getAccountBalance(acc_id) {
    try {
      if (!acc_id) {
        ErrorLogger.log(
          "Missing acc_id Parameeter: TransactionController.getAccountBalance",
          "error",
        );
        return errorResponse("error", 400);
      }

      // Fetch total debit and credit for this account
      const result = await transactionRepository.getBalance(acc_id);

      const totalDebit = result._sum.debit || 0;
      const totalCredit = result._sum.credit || 0;
      const balance = totalDebit - totalCredit;

      return successResponse(
        {
          accountId: parseInt(acc_id),
          totalDebit,
          totalCredit,
          balance,
        },
        "Success",
      );
    } catch (error) {
      ErrorLogger.log(
        "Failed to get Balance in Method: TransactionController.getAccountBalance",
        error,
      );
      return errorResponse(error, 500);
    }
  }

  async create(req) {
    try {
      const { req_object } = await req.json();

      const required = [
        "acc_id",
        "financial_year",
        "voucher_type",
        "reference_id",
        "reference",
      ];

      for (const field of required) {
        if (!req_object[field]) {
          const error = new Error(`${field} is required`);
          ErrorLogger.log(
            "Failed to create Transaction in Method: TransactionController.create",
            error,
          );
          return errorResponse(error, 400);
        }
      }

      const data = req_object;

      const transaction = await transactionRepository.create(data);
      await RedisService.del("transactions:all");
      return successResponse({ transaction }, "Success");
    } catch (err) {
      if (err.code === "P2002") {
        ErrorLogger.log(
          "transaction already exists in Method: TransactionController.create",
          err,
        );
        return errorResponse(new Error("Transaction already exists"), 400);
      }
      ErrorLogger.log(
        "Failed to create Transaction in Method: TransactionController.create",
        err,
      );
      return errorResponse(err, 500);
    }
  }

  async readTrialBalance(req) {
    try {
      const { searchParams } = new URL(req.url);
      const start_dat = searchParams.get("start_dat");
      const end_dat = searchParams.get("end_dat");
      const trialBalance = await transactionRepository.readTrialBalance({
        start_dat: start_dat || null,
        end_dat: end_dat || null,
      });
      return successResponse(trialBalance, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to read trial balance in Method: TransactionController.readTrialBalance",
        err,
      );
      return errorResponse(err, 500);
    }
  }
}

export default new TransactionController();
