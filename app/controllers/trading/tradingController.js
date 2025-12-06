import TradingRepository from "@/app/repositories/trading/tradingRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";
import { createTransactions } from "./tradingTransactions";
import prisma from "@/lib/prisma";

class TradingController {
  async readAll() {
    const cacheKey = "trading:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Trading Cache Hit");
        // RedisService.get() already parses JSON, so no need to parse again
        return successResponse(cachedData, "Success");
      }
      console.log("Trading Cache Miss");
      const data = await TradingRepository.readAll();
      await RedisService.setex(cacheKey, 300, JSON.stringify(data));
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get all trades in Method: TradingController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readById(req) {
    try {
      const { searchParams } = new URL(req.url);
      const trading_id = searchParams.get("trading_id");

      if (!trading_id) {
        const error = new Error("trading_id is required");
        ErrorLogger.log(
          "Failed to get trade by id in Method: TradingController.readById",
          error
        );
        return errorResponse(error, 400);
      }

      const result = await TradingRepository.readById(trading_id);
      if (!result) {
        ErrorLogger.log(
          "Failed to get trade by id in Method: TradingController.readById",
          new Error("Trade not found")
        );
        return errorResponse(new Error("Trade not found"), 404);
      }

      return successResponse(result, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get trade by id in Method: TradingController.readById",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async create(req) {
    try {
      const { req_object } = await req.json();
      const { trading_date, buy_from_account, product_id, buy_price, buy_quantity, buy_total, sale_to_account, sale_price, sale_quantity, sale_total } = req_object;

      if (!trading_date || !buy_from_account || !product_id || !buy_price || !buy_quantity || !sale_to_account || !sale_price || !sale_quantity) {
        const error = new Error(
          "trading_date, buy_from_account, product_id, buy_price, buy_quantity, sale_to_account, sale_price, and sale_quantity are required in Method: TradingController.create"
        );
        ErrorLogger.log(
          "Failed to create trade in Method: TradingController.create",
          error
        );
        return errorResponse(error, 400);
      }

      // CRITICAL FIX: Wrap everything in try-catch to ensure transaction rollback
      const trading = await prisma.$transaction(
        async (tx) => {
          try {
            // Create trading
            const createdTrading = await TradingRepository.create({
              trading_date,
              buy_from_account: Number(buy_from_account),
              do_number: req_object.do_number || null,
              product_id: Number(product_id),
              buy_quantity: Number(buy_quantity),
              buy_price: Number(buy_price),
              buy_tax_type: req_object.buy_tax_type || "flat",
              buy_tax_value: req_object.buy_tax_value || 0,
              buy_discount_type: req_object.buy_discount_type || "percentage",
              buy_discount_value: req_object.buy_discount_value || 0,
              buy_total: Number(buy_total),
              buy_detail: req_object.buy_detail || null,
              sale_to_account: Number(sale_to_account),
              sale_price: Number(sale_price),
              sale_quantity: Number(sale_quantity),
              sale_tax_type: req_object.sale_tax_type || "flat",
              sale_tax_value: req_object.sale_tax_value || 0,
              sale_discount_type: req_object.sale_discount_type || "percentage",
              sale_discount_value: req_object.sale_discount_value || 0,
              sale_total: Number(sale_total),
              sale_detail: req_object.sale_detail || null,
              insert_by: req_object.insert_by || "user 1",
              update_by: req_object.update_by || "user 1",
              status: req_object.status ?? 1,
            }, tx);

            // CRITICAL: Validate trading was created successfully
            if (!createdTrading || !createdTrading.trading_id) {
              throw new Error("Failed to create trading record");
            }

            // Create all related transactions - this will throw if any transaction fails
            await createTransactions(createdTrading, tx);

            return createdTrading;
          } catch (transactionError) {
            // Log the specific error that occurred within the transaction
            ErrorLogger.log(
              "Transaction failed in TradingController.create",
              transactionError
            );
            // Re-throw to trigger rollback
            throw transactionError;
          }
        },
        {
          maxWait: 10000, // 10s to get connection from pool
          timeout: 30000, // 30s for entire transaction
          isolationLevel: "Serializable", // Prevents partial commits
        }
      );

      await RedisService.del("trading:all");
      return successResponse(
        { trading_id: trading.trading_id },
        "Trade created successfully"
      );
    } catch (err) {
      ErrorLogger.log(
        "Failed to create trade in Method: TradingController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { trading_id } = req_object;

      if (!trading_id) {
        const error = new Error(
          "trading_id is required in Method: TradingController.update"
        );
        ErrorLogger.log(
          "Failed to update trade in Method: TradingController.update",
          error
        );
        return errorResponse(error, 400);
      }

      const result = await TradingRepository.update(trading_id, {
        ...req_object,
        buy_from_account: req_object.buy_from_account ? Number(req_object.buy_from_account) : undefined,
        product_id: req_object.product_id ? Number(req_object.product_id) : undefined,
        buy_quantity: req_object.buy_quantity ? Number(req_object.buy_quantity) : undefined,
        buy_price: req_object.buy_price ? Number(req_object.buy_price) : undefined,
        buy_tax_value: req_object.buy_tax_value !== undefined ? Number(req_object.buy_tax_value) : undefined,
        buy_discount_value: req_object.buy_discount_value !== undefined ? Number(req_object.buy_discount_value) : undefined,
        buy_total: req_object.buy_total ? Number(req_object.buy_total) : undefined,
        sale_to_account: req_object.sale_to_account ? Number(req_object.sale_to_account) : undefined,
        sale_price: req_object.sale_price ? Number(req_object.sale_price) : undefined,
        sale_quantity: req_object.sale_quantity ? Number(req_object.sale_quantity) : undefined,
        sale_tax_value: req_object.sale_tax_value !== undefined ? Number(req_object.sale_tax_value) : undefined,
        sale_discount_value: req_object.sale_discount_value !== undefined ? Number(req_object.sale_discount_value) : undefined,
        sale_total: req_object.sale_total ? Number(req_object.sale_total) : undefined,
      });

      await RedisService.del("trading:all");
      return successResponse(result, "Trade updated successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to update trade in Method: TradingController.update",
          err
        );
        return errorResponse(new Error("Trade not found"), 404);
      }
      ErrorLogger.log(
        "Failed to update trade in Method: TradingController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async delete(req) {
    try {
      const { searchParams } = new URL(req.url);
      const trading_id = searchParams.get("trading_id");

      if (!trading_id) {
        ErrorLogger.log(
          "Failed to delete trade in Method: TradingController.delete",
          new Error("trading_id is required")
        );
        return errorResponse(new Error("trading_id is required"), 400);
      }

      await TradingRepository.delete(trading_id);

      await RedisService.del("trading:all");
      return successResponse({}, "Trade deleted successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to delete trade in Method: TradingController.delete",
          err
        );
        return errorResponse(new Error("Trade not found"), 404);
      }
      ErrorLogger.log(
        "Failed to delete trade in Method: TradingController.delete",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new TradingController();

