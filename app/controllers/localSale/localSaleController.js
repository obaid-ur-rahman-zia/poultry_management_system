import LocalSaleRepository from "@/app/repositories/localSale/localSaleRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import { AccountConfigService } from "@/app/utils/accountConfigService";
import ErrorLogger from "@/app/utils/errorLogger";

async function deductStock(local_account, weightToDeduct, tx) {
  const localAccount = await tx.accounts.findUnique({
    where: { acc_id: local_account },
  });
  if (!localAccount) throw new Error("Local account not found");

  let w1 = localAccount.weight_one || 0;
  let w2 = localAccount.weight_two || 0;
  let w3 = localAccount.weight_three || 0;

  let totalStock = w1 + w2 + w3;
  if (weightToDeduct > totalStock) {
    throw new Error(
      `Cannot sell more than available stock in local account. Available stock: ${totalStock}`,
    );
  }

  let newW3 = w3;
  let newW2 = w2;
  let newW1 = w1;
  let updateData = {};

  if (weightToDeduct > 0 && newW3 > 0) {
    if (weightToDeduct >= newW3) {
      weightToDeduct -= newW3;
      updateData.weight_three = null;
      updateData.rate_three = null;
    } else {
      updateData.weight_three = newW3 - weightToDeduct;
      weightToDeduct = 0;
    }
  }
  if (weightToDeduct > 0 && newW2 > 0) {
    if (weightToDeduct >= newW2) {
      weightToDeduct -= newW2;
      updateData.weight_two = null;
      updateData.rate_two = null;
    } else {
      updateData.weight_two = newW2 - weightToDeduct;
      weightToDeduct = 0;
    }
  }
  if (weightToDeduct > 0 && newW1 > 0) {
    if (weightToDeduct >= newW1) {
      weightToDeduct -= newW1;
      updateData.weight_one = null;
      updateData.rate_one = null;
    } else {
      updateData.weight_one = newW1 - weightToDeduct;
      weightToDeduct = 0;
    }
  }

  if (Object.keys(updateData).length > 0) {
    await tx.accounts.update({
      where: { acc_id: local_account },
      data: updateData,
    });
  }
}

async function addStock(local_account, weightToAdd, tx) {
  const localAccount = await tx.accounts.findUnique({
    where: { acc_id: local_account },
  });
  if (!localAccount) return;

  let updateData = {};
  if (!localAccount.weight_one || localAccount.weight_one === 0) {
    updateData.weight_one = weightToAdd;
  } else if (!localAccount.weight_two || localAccount.weight_two === 0) {
    updateData.weight_two = weightToAdd;
  } else if (!localAccount.weight_three || localAccount.weight_three === 0) {
    updateData.weight_three = weightToAdd;
  } else {
    // fallback, just add to w3
    updateData.weight_three = (localAccount.weight_three || 0) + weightToAdd;
  }

  if (Object.keys(updateData).length > 0) {
    await tx.accounts.update({
      where: { acc_id: local_account },
      data: updateData,
    });
  }
}

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

      let data, total;
      if (getAll) {
        data = await LocalSaleRepository.readAll();
        total = data.length;
        return successResponse({ data }, "Success");
      } else {
        const result = await LocalSaleRepository.readAllWithPagination(
          skip,
          limit,
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

  async readReportDetail(req) {
    try {
      const searchParams = req?.nextUrl?.searchParams || new URL(req?.url || "").searchParams;
      const start_dat = searchParams.get("start_dat");
      const end_dat = searchParams.get("end_dat");
      const local_account = searchParams.get("local_account");

      if (!start_dat || !end_dat) {
        return errorResponse(new Error("start_dat and end_dat are required"), 400);
      }

      const result = await LocalSaleRepository.readReportDetail(start_dat, end_dat, local_account);

      return successResponse(result, "Success");
    } catch (err) {
      ErrorLogger.log("LocalSaleController.readReportDetail", err);
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

      const localSale = await prisma.$transaction(
        async (tx) => {
          await deductStock(local_account, Number(purchaser_weight), tx);

          const created = await LocalSaleRepository.create(req_object, tx);
          if (!created || !created.local_sale_id)
            throw new Error("Failed to create local sale record");

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

      const localSale = await prisma.$transaction(
        async (tx) => {
          const diff =
            Number(req_object.purchaser_weight) -
            Number(existing.purchaser_weight);
          if (diff > 0) {
            await deductStock(
              req_object.local_account || existing.local_account,
              diff,
              tx,
            );
          } else if (diff < 0) {
            await addStock(
              req_object.local_account || existing.local_account,
              Math.abs(diff),
              tx,
            );
          }

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
          await addStock(existing.local_account, existing.purchaser_weight, tx);
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
