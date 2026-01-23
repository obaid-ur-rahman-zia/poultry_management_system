import WholeSaleRepository from "@/app/repositories/wholeSale/wholeSaleRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";
import { createTransactions } from "./wholeSaleTransactions";
import transactionRepository from "@/app/repositories/transaction/transactionRepository";
import prisma from "@/lib/prisma";

class WholeSaleController {
  async readAll(req) {
    const cacheKey = "wholeSale:all";
    try {
      // Extract pagination params
      const searchParams = req?.nextUrl?.searchParams || new URL(req?.url || "").searchParams;
      const getAll = searchParams.get("all") === "true";
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const skip = (page - 1) * limit;

      // If getAll is true, fetch all whole sales without pagination
      let data, total;
      if (getAll) {
        data = await WholeSaleRepository.readAll();
        total = data.length;
      } else {
        // Get total count and paginated whole sales
        const result = await WholeSaleRepository.readAllWithPagination(skip, limit);
        data = result.data;
        total = result.total;
      }

      // Use cache key with pagination to avoid cache conflicts
      const userCacheKey = getAll
        ? `${cacheKey}:all`
        : `${cacheKey}:page:${page}:limit:${limit}`;

      const cachedData = await RedisService.get(userCacheKey);
      if (cachedData) {
        console.log("Whole Sale Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Whole Sale Cache Miss");

      // If getAll, return all whole sales without pagination structure
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
        "Failed to get all whole sales in Method: WholeSaleController.readAll",
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
        const error = new Error("sale_id is required");
        ErrorLogger.log(
          "Failed to get whole sale by id in Method: WholeSaleController.readById",
          error
        );
        return errorResponse(error, 400);
      }

      const result = await WholeSaleRepository.readById(sale_id);
      if (!result) {
        ErrorLogger.log(
          "Failed to get whole sale by id in Method: WholeSaleController.readById",
          new Error("Whole sale not found")
        );
        return errorResponse(new Error("Whole sale not found"), 404);
      }

      return successResponse(result, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get whole sale by id in Method: WholeSaleController.readById",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async create(req) {
    try {
      const { req_object } = await req.json();
      const {
        sale_date,
        farm_rate,
        sale_rate,
        former_account,
        purcher_account,
        van_number,
        weight,
        former_rate,
        former_amount,
        purcher_amount,
      } = req_object;

      if (
        !sale_date ||
        !former_account ||
        !purcher_account ||
        !van_number ||
        !weight ||
        !former_rate ||
        !former_amount ||
        !purcher_amount
      ) {
        const error = new Error(
          "sale_date, former_account, purcher_account, van_number, weight, former_rate, former_amount, and purcher_amount are required in Method: WholeSaleController.create"
        );
        ErrorLogger.log(
          "Failed to create whole sale in Method: WholeSaleController.create",
          error
        );
        return errorResponse(error, 400);
      }

      // Extract set_fs_rate flag
      const { set_fs_rate, ...saleData } = req_object;

      // CRITICAL FIX: Wrap everything in try-catch to ensure transaction rollback
      const wholeSale = await prisma.$transaction(
        async (tx) => {
          try {
            // If set_fs_rate is true and rates are provided, check if rate already exists for this date
            if (set_fs_rate && (saleData.farm_rate || saleData.sale_rate)) {
              const date = new Date(saleData.sale_date);
              date.setHours(0, 0, 0, 0);
              const nextDay = new Date(date);
              nextDay.setDate(nextDay.getDate() + 1);

              // Check if F.S Rate already exists for this date in any whole sale
              const existingRate = await tx.whole_sale.findFirst({
                where: {
                  sale_date: {
                    gte: date,
                    lt: nextDay,
                  },
                  OR: [
                    { farm_rate: { not: null } },
                    { sale_rate: { not: null } },
                  ],
                  status: 1,
                },
              });

              if (!existingRate) {
                // F.S Rate doesn't exist for this date, it will be set with this sale
                // No separate table needed, it's stored in whole_sale table
              }
            }

            // Create whole sale
            const createdWholeSale = await WholeSaleRepository.create(
              saleData,
              tx
            );

            // CRITICAL: Validate wholeSale was created successfully
            if (!createdWholeSale || !createdWholeSale.sale_id) {
              throw new Error("Failed to create whole sale record");
            }

            // Create all related transactions - this will throw if any transaction fails
            // If ANY transaction fails, the entire transaction will rollback (atomicity)
            await createTransactions(createdWholeSale, tx);

            return createdWholeSale;
          } catch (error) {
            // Log error before re-throwing
            // This will cause the entire transaction to rollback
            console.error(
              "Transaction error in WholeSaleController.create:",
              error
            );
            throw error;
          }
        },
        {
          maxWait: 5000, // default: 2000
          timeout: 10000, // default: 5000
          isolationLevel: "Serializable", // Ensure strict isolation
        }
      );

      // Clear cache AFTER transaction commits successfully
      // If transaction failed, this won't execute
      await RedisService.del("wholeSale:all");
      await RedisService.del("transactions:all");
      await RedisService.del("accountSubHeads:all");
      await RedisService.del("accounts:all");

      return successResponse(wholeSale, "Whole sale created successfully");
    } catch (err) {
      ErrorLogger.log(
        "Failed to create whole sale in Method: WholeSaleController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { sale_id } = req_object;

      if (!sale_id) {
        const error = new Error("sale_id is required");
        ErrorLogger.log(
          "Failed to update whole sale in Method: WholeSaleController.update",
          error
        );
        return errorResponse(error, 400);
      }

      // Check if whole sale exists
      const existingWholeSale = await WholeSaleRepository.readById(sale_id);
      if (!existingWholeSale || existingWholeSale.status === 0) {
        ErrorLogger.log(
          "Failed to update whole sale in Method: WholeSaleController.update",
          new Error("Whole sale not found")
        );
        return errorResponse(new Error("Whole sale not found"), 404);
      }

      // Validate required fields for update
      const {
        sale_date,
        former_account,
        purcher_account,
        van_number,
        weight,
        former_rate,
        former_amount,
        purcher_amount,
      } = req_object;

      if (
        !sale_date ||
        !former_account ||
        !purcher_account ||
        !van_number ||
        !weight ||
        !former_rate ||
        !former_amount ||
        !purcher_amount
      ) {
        const error = new Error(
          "sale_date, former_account, purcher_account, van_number, weight, former_rate, former_amount, and purcher_amount are required"
        );
        ErrorLogger.log(
          "Failed to update whole sale in Method: WholeSaleController.update",
          error
        );
        return errorResponse(error, 400);
      }

      // Extract set_fs_rate flag
      const { set_fs_rate, ...saleData } = req_object;

      // Use database transaction for atomicity
      const wholeSale = await prisma.$transaction(
        async (tx) => {
          try {
            // Delete all old transactions related to this whole sale
            await transactionRepository.softDeleteByReferenceId(
              sale_id,
              "Whole Sale",
              tx
            );

            // Update the whole sale record
            const updatedWholeSale = await WholeSaleRepository.update(
              sale_id,
              saleData,
              tx
            );

            // CRITICAL: Validate update was successful
            if (!updatedWholeSale || !updatedWholeSale.sale_id) {
              throw new Error("Failed to update whole sale record");
            }

            // Create new transactions based on updated values
            await createTransactions(updatedWholeSale, tx);

            return updatedWholeSale;
          } catch (error) {
            // Log error before re-throwing
            console.error(
              "Transaction error in WholeSaleController.update:",
              error
            );
            throw error;
          }
        },
        {
          maxWait: 5000,
          timeout: 10000,
          isolationLevel: "Serializable",
        }
      );

      // Clear cache AFTER transaction commits successfully
      // If transaction failed, this won't execute
      await RedisService.del("wholeSale:all");
      await RedisService.del("transactions:all");
      await RedisService.del("accountSubHeads:all");
      await RedisService.del("accounts:all");

      return successResponse(wholeSale, "Whole sale updated successfully");
    } catch (err) {
      ErrorLogger.log(
        "Failed to update whole sale in Method: WholeSaleController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async delete(req) {
    try {
      const { searchParams } = new URL(req.url);
      const sale_id = searchParams.get("sale_id");

      if (!sale_id) {
        const error = new Error("sale_id is required");
        ErrorLogger.log(
          "Failed to delete whole sale in Method: WholeSaleController.delete",
          error
        );
        return errorResponse(error, 400);
      }

      // Check if whole sale exists
      const existingWholeSale = await WholeSaleRepository.readById(sale_id);
      if (!existingWholeSale || existingWholeSale.status === 0) {
        ErrorLogger.log(
          "Failed to delete whole sale in Method: WholeSaleController.delete",
          new Error("Whole sale not found")
        );
        return errorResponse(new Error("Whole sale not found"), 404);
      }

      // Use database transaction to delete whole sale and its transactions
      await prisma.$transaction(
        async (tx) => {
          try {
            // Delete all transactions related to this whole sale
            await transactionRepository.softDeleteByReferenceId(
              sale_id,
              "Whole Sale",
              tx
            );

            // Delete (soft delete) the whole sale record
            await WholeSaleRepository.delete(sale_id, tx);
          } catch (error) {
            // Log error before re-throwing
            console.error(
              "Transaction error in WholeSaleController.delete:",
              error
            );
            throw error;
          }
        },
        {
          maxWait: 5000,
          timeout: 10000,
          isolationLevel: "Serializable",
        }
      );

      // Clear cache after successful deletion
      await RedisService.del("wholeSale:all");
      await RedisService.del("transactions:all");

      return successResponse(null, "Whole sale deleted successfully");
    } catch (err) {
      ErrorLogger.log(
        "Failed to delete whole sale in Method: WholeSaleController.delete",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async checkFsRate(req) {
    try {
      const { searchParams } = new URL(req.url);
      const sale_date = searchParams.get("sale_date");

      if (!sale_date) {
        const error = new Error("sale_date is required");
        ErrorLogger.log(
          "Failed to check F.S Rate in Method: WholeSaleController.checkFsRate",
          error
        );
        return errorResponse(error, 400);
      }

      const fsRate = await WholeSaleRepository.checkFsRateForToday(sale_date);

      if (fsRate) {
        return successResponse(
          {
            exists: true,
            farm_rate: fsRate.farm_rate,
            sale_rate: fsRate.sale_rate,
          },
          "F.S Rate found"
        );
      } else {
        return successResponse(
          {
            exists: false,
            farm_rate: null,
            sale_rate: null,
          },
          "F.S Rate not found"
        );
      }
    } catch (err) {
      ErrorLogger.log(
        "Failed to check F.S Rate in Method: WholeSaleController.checkFsRate",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async getPreviousFsRates(req) {
    try {
      const rates = await WholeSaleRepository.getPreviousFsRates();
      return successResponse(rates, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get previous F.S Rates in Method: WholeSaleController.getPreviousFsRates",
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
        ErrorLogger.log(
          "Failed to read report detail in Method: WholeSaleController.readReportDetail",
          error
        );
        return errorResponse(error, 400);
      }
      const wholeSale = await WholeSaleRepository.readReportDetail({
        start_dat: start_dat,
      end_dat: end_dat,
      });

      return successResponse(wholeSale, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to read report detail in Method: WholeSaleController.readReportDetail",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new WholeSaleController();
