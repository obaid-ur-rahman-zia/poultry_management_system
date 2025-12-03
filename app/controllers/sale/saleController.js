import SaleRepository from "@/app/repositories/sale/saleRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import errorLogger from "@/app/utils/errorLogger";
import prisma from "@/lib/prisma";
import { createTransactions } from "@/app/controllers/sale/saleTransactions";
import transactionRepository from "@/app/repositories/transaction/transactionRepository";
import RedisService from "@/app/utils/redis";

class SaleController {
  async readAll() {
    const cacheKey = "sales:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Sale Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Sale Cache Miss");
      const sale_data = await SaleRepository.readAll();
      const nextId = await SaleRepository.readNextId();
      await RedisService.setex(
        cacheKey,
        300,
        JSON.stringify({ sale_data, nextId })
      );
      return successResponse({ sale_data, nextId }, "Success");
    } catch (err) {
      errorLogger.log(
        "Failed to fetch sales in Method: SaleController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readById(req) {
    try {
      const { searchParams } = new URL(req.url);
      const sale_id = searchParams.get("sale_id");
      if (!sale_id) {
        const error = new Error("Sale ID is required");
        errorLogger.log(
          "Failed to get sale by id in Method: SaleController.readById",
          error
        );
        return errorResponse(error, 400);
      }
      const result = await SaleRepository.readById(sale_id);
      if (!result) {
        const error = new Error("Sale not found");
        errorLogger.log(
          "Failed to get sale by id in Method: SaleController.readById",
          error
        );
        return errorResponse(error, 404);
      }
      return successResponse(result, "Success");
    } catch (err) {
      errorLogger.log(
        "Failed to get sale by id in Method: SaleController.readById",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async create(req) {
    try {
      const { req_object } = await req.json();
      if (!req_object.items || req_object.items.length === 0) {
        errorLogger.log("Cart cannot be empty in SaleController.create");
        return errorResponse(
          "Cart cannot be empty in SaleController.create",
          400
        );
      }
      const { sale_dat, salesman_id, customer_id, total_amount } = req_object;

      if (!salesman_id || !sale_dat || !customer_id || !total_amount) {
        errorLogger.log("Missing required fields in SaleController.create");
        return errorResponse(
          "Missing required fields in SaleController.create",
          400
        );
      }

      // CRITICAL FIX: Wrap everything in try-catch to ensure transaction rollback
      const sale = await prisma.$transaction(
        async (tx) => {
          try {
            // Create sale
            const createdSale = await SaleRepository.create(req_object, tx);

            // CRITICAL: Validate sale was created successfully
            if (!createdSale || !createdSale.sale_id) {
              throw new Error("Failed to create sale record");
            }

            // Create all related transactions - this will throw if any transaction fails
            await createTransactions(createdSale, req_object.items, tx);

            return createdSale;
          } catch (transactionError) {
            // Log the specific error that occurred within the transaction
            errorLogger.log(
              "Transaction failed in SaleController.create",
              transactionError
            );
            // Re-throw to trigger rollback
            throw transactionError;
          }
        },
        {
          maxWait: 10000, // 10s to get connection from pool
          timeout: 30000, // 30s for entire transaction (was 10s)
          isolationLevel: "Serializable", // Prevents partial commits
        }
      );
      await RedisService.del("sales:all");

      return successResponse(
        { sale_id: sale.sale_id },
        "Sale created successfully"
      );
    } catch (err) {
      if (err.code === "P2002") {
        errorLogger.log("Duplication Occured in Sale Controller.create");
        return errorResponse(
          "Duplication Occured in Sale Controller.create",
          400
        );
      }
      errorLogger.log(
        "Failed to create sale in Method: SaleController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { sale_id } = req_object;

      // Validation
      if (!sale_id) {
        const error = new Error("sale_id is required");
        errorLogger.log(
          "Failed to update sale in Method: SaleController.update",
          error
        );
        return errorResponse(error, 400);
      }

      if (!req_object.items || req_object.items.length === 0) {
        const error = new Error("Cart can't be empty");
        errorLogger.log(
          "Failed to update sale in Method: SaleController.update",
          error
        );
        return errorResponse(error, 400);
      }

      // Use database transaction for atomicity
      const updated = await prisma.$transaction(
        async (tx) => {
          try {
            // Delete all old transactions related to this sale
            await transactionRepository.softDeleteByReferenceId(
              sale_id,
              "Sale",
              tx
            );

            // Update the sale
            const updatedSale = await SaleRepository.update(req_object, tx);

            // CRITICAL: Validate update was successful
            if (!updatedSale || !updatedSale.sale_id) {
              throw new Error("Failed to update sale record");
            }

            // Create new transactions based on updated values
            await createTransactions(updatedSale, req_object.items, tx);

            return updatedSale;
          } catch (transactionError) {
            errorLogger.log(
              "Transaction failed in SaleController.update",
              transactionError
            );
            throw transactionError;
          }
        },
        {
          maxWait: 10000, // 10s to get connection from pool
          timeout: 30000, // 30s for entire transaction (was 10s)
          isolationLevel: "Serializable", // Prevents partial commits
        }
      );
      return successResponse(
        { SaleID: updated.sale_id },
        "Sale updated successfully"
      );
    } catch (err) {
      errorLogger.log(
        "Failed to update sale in Method: SaleController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readByProduct(req) {
    try {
      const { searchParams } = new URL(req.url);
      const product_id = searchParams.get("product_id");
      const customer_id = searchParams.get("customer_id");

      if (!product_id || !customer_id) {
        const error = new Error("Product ID and customer ID are required");
        errorLogger.log(
          "Failed to read Sales in Method: SaleController.readByProduct",
          error
        );
        return errorResponse(error, 400);
      }

      const sales = await SaleRepository.readByProduct({
        product_id: Number(product_id),
        customer_id: Number(customer_id),
      });

      return successResponse(sales, "Success");
    } catch (err) {
      errorLogger.log(
        "Failed to read sales in Method: SaleController.readByProduct",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readReportDetail(req) {
    try {
      const { searchParams } = new URL(req.url);
      const start_dat = searchParams.get("start_dat");
      const end_dat = searchParams.get("end_dat");

      if (!start_dat || !end_dat) {
        const error = new Error("start_dat and end_dat are required");
        errorLogger.log(
          "Failed to read report detail in Method: SaleController.readReportDetail",
          error
        );
        return errorResponse(error, 400);
      }
      const sales = await SaleRepository.readReportDetail({
        start_dat: start_dat,
        end_dat: end_dat,
      });
      return successResponse(sales, "Success");
    } catch (err) {
      errorLogger.log(
        "Failed to read report detail in Method: SaleController.readReportDetail",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new SaleController();
