import PurchaseRepository from "@/app/repositories/purchase/purchaseRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import errorLogger from "@/app/utils/errorLogger";
import prisma from "@/lib/prisma";
import { createTransactions } from "@/app/controllers/purchase/purchaseTransactions";
import transactionRepository from "@/app/repositories/transaction/transactionRepository";
import RedisService from "@/app/utils/redis";

class PurchaseController {
  async readAll() {
    const cacheKey = "purchases:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Purchase Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Purchase Cache Miss");
      const purchase_data = await PurchaseRepository.readAll();
      const nextId = await PurchaseRepository.readNextId();
      await RedisService.setex(
        cacheKey,
        300,
        JSON.stringify({ purchase_data, nextId })
      );
      return successResponse({ purchase_data, nextId }, "Success");
    } catch (err) {
      errorLogger.log(
        "Failed to fetch purchases in Method: PurchaseController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readById(req) {
    try {
      const { searchParams } = new URL(req.url);
      const purchase_id = searchParams.get("purchase_id");
      if (!purchase_id) {
        const error = new Error("Purchase ID is required");
        errorLogger.log(
          "Failed to get purchase by id in Method: PurchaseController.readById",
          error
        );
        return errorResponse(error, 400);
      }
      const result = await PurchaseRepository.readById(purchase_id);
      if (!result) {
        const error = new Error("Purchase not found");
        errorLogger.log(
          "Failed to get purchase by id in Method: PurchaseController.readById",
          error
        );
        return errorResponse(error, 404);
      }
      return successResponse(result, "Success");
    } catch (err) {
      errorLogger.log(
        "Failed to get purchase by id in Method: PurchaseController.readById",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async create(req) {
    try {
      const { req_object } = await req.json();
      if (!req_object.items || req_object.items.length === 0) {
        errorLogger.log("Cart cannot be empty in PurchaseController.create");
        return errorResponse(
          "Cart cannot be empty in PurchaseController.create",
          400
        );
      }
      const { invoice_dat, purchase_dat, supplier_id, total_amount } =
        req_object;

      if (!invoice_dat || !purchase_dat || !supplier_id || !total_amount) {
        errorLogger.log("Missing required fields in PurchaseController.create");
        return errorResponse(
          "Missing required fields in PurchaseController.create",
          400
        );
      }

      // CRITICAL FIX: Wrap everything in try-catch to ensure transaction rollback
      const purchase = await prisma.$transaction(
        async (tx) => {
          try {
            // Create purchase
            const createdPurchase = await PurchaseRepository.create(
              req_object,
              tx
            );

            // CRITICAL: Validate purchase was created successfully
            if (!createdPurchase || !createdPurchase.purchase_id) {
              throw new Error("Failed to create purchase record");
            }

            // Create all related transactions - this will throw if any transaction fails
            await createTransactions(createdPurchase, req_object.items, tx);

            return createdPurchase;
          } catch (transactionError) {
            // Log the specific error that occurred within the transaction
            errorLogger.log(
              "Transaction failed in PurchaseController.create",
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
      await RedisService.del("purchases:all");
      return successResponse(
        { purchase_id: purchase.purchase_id },
        "Purchase created successfully"
      );
    } catch (err) {
      if (err.code === "P2002") {
        errorLogger.log("Duplication Occured in Purchase Controller.create");
        return errorResponse(
          "Duplication Occured in Purchase Controller.create",
          400
        );
      }
      errorLogger.log(
        "Failed to create purchase in Method: PurchaseController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { purchase_id } = req_object;

      // Validation
      if (!purchase_id) {
        const error = new Error("purchase_id is required");
        errorLogger.log(
          "Failed to update purchase in Method: PurchaseController.update",
          error
        );
        return errorResponse(error, 400);
      }

      if (!req_object.items || req_object.items.length === 0) {
        const error = new Error("Cart can't be empty");
        errorLogger.log(
          "Failed to update purchase in Method: PurchaseController.update",
          error
        );
        return errorResponse(error, 400);
      }

      // Use database transaction for atomicity
      const updated = await prisma.$transaction(
        async (tx) => {
          try {
            // Delete all old transactions related to this purchase
            await transactionRepository.softDeleteByReferenceId(
              purchase_id,
              "Purchase",
              tx
            );

            // Update the purchase
            const updatedPurchase = await PurchaseRepository.update(
              req_object,
              tx
            );

            // CRITICAL: Validate update was successful
            if (!updatedPurchase || !updatedPurchase.purchase_id) {
              throw new Error("Failed to update purchase record");
            }

            // Create new transactions based on updated values
            await createTransactions(updatedPurchase, req_object.items, tx);

            return updatedPurchase;
          } catch (transactionError) {
            errorLogger.log(
              "Transaction failed in PurchaseController.update",
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
        { PurchaseID: updated.purchase_id },
        "Purchase updated successfully"
      );
    } catch (err) {
      errorLogger.log(
        "Failed to update purchase in Method: PurchaseController.update",
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
          "Failed to read report detail in Method: PurchaseController.readReportDetail",
          error
        );
        return errorResponse(error, 400);
      }
      const purchase = await PurchaseRepository.readReportDetail({
        start_dat: start_dat,
        end_dat: end_dat,
      });

      return successResponse(purchase, "Success");
    } catch (err) {
      errorLogger.log(
        "Failed to read report detail in Method: PurchaseController.readReportDetail",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new PurchaseController();
