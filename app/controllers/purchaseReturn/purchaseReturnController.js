import PurchaseReturnRepository from "@/app/repositories/purchaseReturn/purchaseReturnRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import errorLogger from "@/app/utils/errorLogger";
import prisma from "@/lib/prisma";
import { createTransactions } from "./purchaseReturnTransactions";
import transactionRepository from "@/app/repositories/transaction/transactionRepository";
import RedisService from "@/app/utils/redis";

class PurchaseReturnController {
  async readAll() {
    const cacheKey = "purchaseReturns:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Purchase Return Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Purchase Return Cache Miss");
      const return_data = await PurchaseReturnRepository.readAll();
      const nextId = await PurchaseReturnRepository.readNextId();
      await RedisService.setex(
        cacheKey,
        300,
        JSON.stringify({ return_data, nextId })
      );
      return successResponse({ return_data, nextId }, "Success");
    } catch (err) {
      errorLogger.log(
        "Failed to fetch purchase returns in Method: PurchaseReturnController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readById(req) {
    try {
      const { searchParams } = new URL(req.url);
      const purchase_return_id = searchParams.get("purchase_return_id");
      if (!purchase_return_id) {
        const error = new Error("Purchase Return ID is required");
        errorLogger.log(
          "Failed to get purchase return by id in Method: PurchaseReturnController.readById",
          error
        );
        return errorResponse(error, 400);
      }
      const result = await PurchaseReturnRepository.readById(
        purchase_return_id
      );
      if (!result) {
        const error = new Error("Purchase Return not found");
        errorLogger.log(
          "Failed to get purchase return by id in Method: PurchaseReturnController.readById",
          error
        );
        return errorResponse(error, 404);
      }
      return successResponse(result, "Success");
    } catch (err) {
      errorLogger.log(
        "Failed to get purchase by id in Method: PurchaseReturnController.readById",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async create(req) {
    try {
      const { req_object } = await req.json();
      if (!req_object.items || req_object.items.length === 0) {
        errorLogger.log(
          "Cart cannot be empty in PurchaseReturnController.create"
        );
        return errorResponse(
          "Cart cannot be empty in PurchaseReturnController.create",
          400
        );
      }
      const { return_dat, supplier_id, total_amount } = req_object;
      req_object;

      if (!return_dat || !supplier_id || !total_amount) {
        errorLogger.log(
          "Missing required fields in PurchaseReturnController.create"
        );
        return errorResponse(
          "Missing required fields in PurchaseReturnController.create",
          400
        );
      }

      // CRITICAL FIX: Wrap everything in try-catch to ensure transaction rollback
      const purchaseReturn = await prisma.$transaction(
        async (tx) => {
          try {
            // Create purchase return
            const createdPurchaseReturn = await PurchaseReturnRepository.create(
              req_object,
              tx
            );

            // CRITICAL: Validate purchase was created successfully
            if (
              !createdPurchaseReturn ||
              !createdPurchaseReturn.purchase_return_id
            ) {
              throw new Error("Failed to create purchase return");
            }

            // Create all related transactions - this will throw if any transaction fails
            await createTransactions(
              createdPurchaseReturn,
              req_object.items,
              tx
            );

            return createdPurchaseReturn;
          } catch (transactionError) {
            // Log the specific error that occurred within the transaction
            errorLogger.log(
              "Transaction failed in PurchaseReturnController.create",
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
      await RedisService.del("purchaseReturns:all");
      return successResponse(
        { purchase_return_id: purchaseReturn.purchase_return_id },
        "Purchase Return created successfully"
      );
    } catch (err) {
      if (err.code === "P2002") {
        errorLogger.log(
          "Duplication Occured in PurchaseReturnController.create"
        );
        return errorResponse(
          "Duplication Occured in PurchaseReturnController.create",
          400
        );
      }
      errorLogger.log(
        "Failed to create purchase return in Method: PurchaseReturnController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { purchase_return_id } = req_object;

      // Validation
      if (!purchase_return_id) {
        const error = new Error("purchase_return_id is required");
        errorLogger.log(
          "Failed to update purchase return in Method: PurchaseReturnController.update",
          error
        );
        return errorResponse(error, 400);
      }

      if (!req_object.items || req_object.items.length === 0) {
        const error = new Error("Cart can't be empty");
        errorLogger.log(
          "Failed to update purchase return in Method: PurchaseReturnController.update",
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
              purchase_return_id,
              "Purchase Return",
              tx
            );

            // Update the purchase
            const updatedReturn = await PurchaseReturnRepository.update(
              req_object,
              tx
            );

            // CRITICAL: Validate update was successful
            if (!updatedReturn || !updatedReturn.purchase_return_id) {
              throw new Error("Failed to update purchase return");
            }

            // Create new transactions based on updated values
            await createTransactions(updatedReturn, req_object.items, tx);

            return updatedReturn;
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
        { PurchaseReturnID: updated.purchase_return_id },
        "Purchase Return updated successfully"
      );
    } catch (err) {
      errorLogger.log(
        "Failed to update purchase return in Method: PurchaseReturnController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }

  // async readByProduct(req) {
  //   try {
  //     const { searchParams } = new URL(req.url);
  //     const product_id = searchParams.get("product_id");
  //     const supplier_id = searchParams.get("supplier_id");

  //     if (!product_id || !supplier_id) {
  //       const error = new Error("Product ID and Supplier ID are required");
  //       errorLogger.log(
  //         "Failed to read purchases in Method: PurchaseController.readByProduct",
  //         error
  //       );
  //       return errorResponse(error, 400);
  //     }

  //     const purchases = await PurchaseRepository.readByProduct({
  //       product_id: Number(product_id),
  //       supplier_id: Number(supplier_id),
  //     });

  //     return successResponse(purchases, "Success");
  //   } catch (err) {
  //     errorLogger.log(
  //       "Failed to read purchases in Method: PurchaseController.readByProduct",
  //       err
  //     );
  //     return errorResponse(err, 500);
  //   }
  // }
}

export default new PurchaseReturnController();
