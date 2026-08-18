import LocalSaleRepository from "@/app/repositories/localSale/localSaleRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import { AccountConfigService } from "@/app/utils/accountConfigService";
import ErrorLogger from "@/app/utils/errorLogger";
import {
  assertBhagtanwala,
  readSourcesForDate,
  snapshotSources,
} from "@/app/controllers/localSale/bhagtanwalaSourceService";

import transactionRepository from "@/app/repositories/transaction/transactionRepository";
import prisma from "@/lib/prisma";
import { calculateFinancialYear } from "@/app/components/calculateFinYear/financialYear";

class LocalSaleController {
  async readAll(req) {
    try {
      const searchParams =
        req?.nextUrl?.searchParams || new URL(req?.url || "").searchParams;
      const getAll = searchParams.get("all") === "true";
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "20");
      const skip = (page - 1) * limit;

      const searchQuery = searchParams.get("searchQuery") || "";
      const filterDate = searchParams.get("filterDate") || "";

      let data, total;
      if (getAll) {
        data = await LocalSaleRepository.readAll();
        total = data.length;
        return successResponse({ data }, "Success");
      } else {
        const result = await LocalSaleRepository.readAllWithPagination(
          skip,
          limit,
          searchQuery,
          filterDate
        );
        data = result.data;
        total = result.total;
      }

      return successResponse(
        {
          data,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
        "Success",
      );
    } catch (err) {
      ErrorLogger.log("LocalSaleController.readAll", err);
      return errorResponse(err, 500);
    }
  }

  async readById(req) {
    try {
      const { searchParams } = new URL(req.url);
      const local_sale_id = searchParams.get("local_sale_id");
      if (!local_sale_id)
        return errorResponse(new Error("local_sale_id is required"), 400);

      const result = await LocalSaleRepository.readById(local_sale_id);
      if (!result) return errorResponse(new Error("Local sale not found"), 404);

      return successResponse(result, "Success");
    } catch (err) {
      ErrorLogger.log("LocalSaleController.readById", err);
      return errorResponse(err, 500);
    }
  }

  async readSources(req) {
    try {
      const searchParams = req?.nextUrl?.searchParams || new URL(req?.url || "").searchParams;
      const date = searchParams.get("date");
      if (!date) return errorResponse(new Error("date is required"), 400);
      const sources = await readSourcesForDate(date, prisma);
      return successResponse(sources, "Success");
    } catch (err) {
      ErrorLogger.log("LocalSaleController.readSources", err);
      return errorResponse(err, 500);
    }
  }

  async readReportDetail(req) {
    try {
      const searchParams = req?.nextUrl?.searchParams || new URL(req?.url || "").searchParams;
      const start_dat = searchParams.get("start_dat");
      const end_dat = searchParams.get("end_dat");
      const local_account = searchParams.get("local_account");

      if (!start_dat || !end_dat) {
        return errorResponse(new Error("start_dat and end_dat are required"), 400);
      }

      if (local_account) await assertBhagtanwala(local_account, prisma);

      const result = await LocalSaleRepository.readReportDetail(start_dat, end_dat, local_account);

      return successResponse(result, "Success");
    } catch (err) {
      ErrorLogger.log("LocalSaleController.readReportDetail", err);
      return errorResponse(err, 500);
    }
  }

  async readProfitReport(req) {
    try {
      const searchParams = req?.nextUrl?.searchParams || new URL(req?.url || "").searchParams;
      const start_dat = searchParams.get("start_dat");
      const end_dat = searchParams.get("end_dat");
      const local_account = searchParams.get("local_account");
      const group_by = searchParams.get("group_by") || "date";

      if (!start_dat || !end_dat) {
        return errorResponse(new Error("start_dat and end_dat are required"), 400);
      }

      const result = await LocalSaleRepository.readProfitReport(start_dat, end_dat, local_account, group_by);

      return successResponse(result, "Success");
    } catch (err) {
      ErrorLogger.log("LocalSaleController.readProfitReport", err);
      return errorResponse(err, 500);
    }
  }

  async create(req) {
    try {
      const { req_object } = await req.json();
      const {
        local_sale_date,
        local_account,
        purchaser_account,
        purchaser_weight,
        purchaser_rate,
        purchaser_amount,
        received_amount,
      } = req_object;

      if (
        !local_sale_date ||
        !local_account ||
        !purchaser_account ||
        purchaser_weight === undefined ||
        purchaser_rate === undefined ||
        purchaser_amount === undefined ||
        received_amount === undefined
      ) {
        return errorResponse(
          new Error(
            "local_sale_date, local_account, purchaser_account, purchaser_weight, purchaser_rate, purchaser_amount, and received_amount are required",
          ),
          400,
        );
      }

      validateLocalSaleAmounts(req_object);

      const localSale = await prisma.$transaction(
        async (tx) => {
          await assertBhagtanwala(local_account, tx);
          const created = await LocalSaleRepository.create(req_object, tx);
          if (!created || !created.local_sale_id)
            throw new Error("Failed to create local sale record");

          await snapshotSources(created.local_sale_id, local_sale_date, tx);

          await createLocalSaleTransactions(created, tx);
          return created;
        },
        { maxWait: 5000, timeout: 10000, isolationLevel: "Serializable" },
      );

      return successResponse(localSale, "Local sale created successfully", 201);
    } catch (err) {
      ErrorLogger.log("LocalSaleController.create", err);
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { local_sale_id } = req_object;
      if (!local_sale_id)
        return errorResponse(new Error("local_sale_id is required"), 400);

      const existing = await LocalSaleRepository.readById(local_sale_id);
      if (!existing || existing.status === 0)
        return errorResponse(new Error("Local sale not found"), 404);

      validateLocalSaleAmounts(req_object);

      const localSale = await prisma.$transaction(
        async (tx) => {
          await assertBhagtanwala(req_object.local_account, tx);

          await transactionRepository.softDeleteByReferenceId(
            local_sale_id,
            "Local Sale",
            tx,
          );
          const updated = await LocalSaleRepository.update(
            local_sale_id,
            req_object,
            tx,
          );
          if (!updated || !updated.local_sale_id)
            throw new Error("Failed to update local sale record");
          await snapshotSources(updated.local_sale_id, updated.local_sale_date, tx);
          await createLocalSaleTransactions(updated, tx);
          return updated;
        },
        { maxWait: 5000, timeout: 10000, isolationLevel: "Serializable" },
      );

      return successResponse(localSale, "Local sale updated successfully");
    } catch (err) {
      ErrorLogger.log("LocalSaleController.update", err);
      return errorResponse(err, 500);
    }
  }

  async delete(req) {
    try {
      const { searchParams } = new URL(req.url);
      const local_sale_id = searchParams.get("local_sale_id");
      if (!local_sale_id)
        return errorResponse(new Error("local_sale_id is required"), 400);

      const existing = await LocalSaleRepository.readById(local_sale_id);
      if (!existing || existing.status === 0)
        return errorResponse(new Error("Local sale not found"), 404);

      await prisma.$transaction(
        async (tx) => {
          await transactionRepository.softDeleteByReferenceId(
            local_sale_id,
            "Local Sale",
            tx,
          );
          await LocalSaleRepository.delete(local_sale_id, tx);
        },
        { maxWait: 5000, timeout: 10000, isolationLevel: "Serializable" },
      );

      return successResponse(null, "Local sale deleted successfully");
    } catch (err) {
      ErrorLogger.log("LocalSaleController.delete", err);
      return errorResponse(err, 500);
    }
  }
}

function validateLocalSaleAmounts(data) {
  const amount = Number(data.purchaser_amount);
  const received = Number(data.received_amount);
  const weight = Number(data.purchaser_weight);
  const rate = Number(data.purchaser_rate);
  if (![amount, received, weight, rate].every(Number.isFinite)) {
    throw new Error("Local sale amounts must be valid numbers");
  }
  if (amount < 0 || received < 0 || weight <= 0 || rate < 0) {
    throw new Error("Local sale amounts must be nonnegative and weight must be greater than zero");
  }
  if (received > amount) {
    throw new Error("Received amount cannot be greater than purchaser amount");
  }
}

async function createLocalSaleTransactions(localSale, tx) {
  if (!localSale || !localSale.local_sale_id) {
    throw new Error(
      "Invalid localSale object provided to createLocalSaleTransactions",
    );
  }

  const financialYear = calculateFinancialYear(
    localSale.local_sale_date instanceof Date
      ? localSale.local_sale_date.toISOString().split("T")[0]
      : new Date(localSale.local_sale_date).toISOString().split("T")[0],
  );

  const constants = {
    reference_id: localSale.local_sale_id,
    financial_year: financialYear,
    reference: "Local Sale",
    voucher_type: "LS",
  };

  const transactionData = [];
  const configService = new AccountConfigService();
  const cashAccountConfig = await configService.getAccountConfig(
    "Cash Account (Super Admin)",
    tx,
  );
  const cash_account = cashAccountConfig?.acc_id;

  // Local account: credit (stock going out) for the total amount
  if (localSale.purchaser_amount > 0) {
    transactionData.push({
      acc_id: localSale.local_account,
      credit: localSale.purchaser_amount,
      debit: 0,
      remarks: `Local Sale#${localSale.local_sale_id} Weight:${localSale.purchaser_weight} Rate@${localSale.purchaser_rate}`,
      ...constants,
    });
  }

  // Calculate the "rest" (remaining amount owed by the purchaser)
  const received = Number(localSale.received_amount || 0);
  const restAmount = Number(localSale.purchaser_amount) - received;

  // Purchaser account: debit the "rest" (money they owe us)
  if (restAmount > 0) {
    transactionData.push({
      acc_id: localSale.purchaser_account,
      debit: restAmount,
      credit: 0,
      remarks: `Local Sale#${localSale.local_sale_id} Weight:${localSale.purchaser_weight} Rate@${localSale.purchaser_rate} - Balance Owed`,
      ...constants,
    });
  }

  // Cash In Hand account: debit the "received amount" (money we got)
  if (received > 0) {
    if (!cash_account) {
      throw new Error(
        "Cash In Hand account is not configured in settings. Cannot process received amount.",
      );
    }

    transactionData.push({
      acc_id: cash_account,
      debit: received,
      credit: 0,
      remarks: `Local Sale#${localSale.local_sale_id} Received Amount`,
      ...constants,
    });
  }

  for (const data of transactionData) {
    const result = await transactionRepository.create(data, tx);
    if (!result || !result.t_id) {
      throw new Error(
        `Failed to create transaction for account ${data.acc_id}`,
      );
    }
  }

  return { success: true, transactionCount: transactionData.length };
}

export default new LocalSaleController();
