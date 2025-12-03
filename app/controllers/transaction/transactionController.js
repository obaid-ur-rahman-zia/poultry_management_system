import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import VoucherRepository from "@/app/repositories/voucher/voucherRepository";
import transactionRepository from "@/app/repositories/transaction/transactionRepository";
import RedisService from "@/app/utils/redis";

class TransactionController {
  async readAll() {
    const cacheKey = "transactions:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Transaction Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Transaction Cache Miss");
      const data = await transactionRepository.readAll();
      await RedisService.setex(cacheKey, 300, JSON.stringify({ data }));
      return successResponse({ data }, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get transactions in Method: transactionController.readAll",
        err
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
          "error"
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
        "Success"
      );
    } catch (err) {
      ErrorLogger.log(
        "Failed to get transactions in Method: transactionController.readAccountLedger",
        err
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
          error
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
        err
      );
      return errorResponse(err, 500);
    }
  }

  async getAccountBalance(acc_id) {
    try {
      if (!acc_id) {
        ErrorLogger.log(
          "Missing acc_id Parameeter: TransactionController.getAccountBalance",
          "error"
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
        "Success"
      );
    } catch (error) {
      ErrorLogger.log(
        "Failed to get Balance in Method: TransactionController.getAccountBalance",
        error
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
            error
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
          err
        );
        return errorResponse(new Error("Transaction already exists"), 400);
      }
      ErrorLogger.log(
        "Failed to create Transaction in Method: TransactionController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new TransactionController();
