import UnitSaleRepository from "@/app/repositories/unitSale/unitSaleRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";
import prisma from "@/lib/prisma";

class UnitSaleController {
  async readAll() {
    const cacheKey = "unitSales:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Unit Sale Cache Hit");
        // RedisService.get() already parses JSON, so no need to parse again
        return successResponse(cachedData, "Success");
      }
      console.log("Unit Sale Cache Miss");
      const data = await UnitSaleRepository.readAll();
      await RedisService.setex(cacheKey, 300, JSON.stringify(data));
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get all unit sales in Method: UnitSaleController.readAll",
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
          "Failed to get unit sale by id in Method: UnitSaleController.readById",
          error
        );
        return errorResponse(error, 400);
      }

      const result = await UnitSaleRepository.readById(sale_id);
      if (!result) {
        ErrorLogger.log(
          "Failed to get unit sale by id in Method: UnitSaleController.readById",
          new Error("Sale not found")
        );
        return errorResponse(new Error("Sale not found"), 404);
      }

      return successResponse(result, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get unit sale by id in Method: UnitSaleController.readById",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async checkFsRate(req) {
    try {
      const { searchParams } = new URL(req.url);
      const prounit_id = searchParams.get("prounit_id") || searchParams.get("farm_id");
      const floc_id = searchParams.get("floc_id");
      const sale_date = searchParams.get("sale_date");

      if (!prounit_id || !floc_id || !sale_date) {
        const error = new Error("prounit_id (or farm_id), floc_id, and sale_date are required");
        ErrorLogger.log(
          "Failed to check F.S Rate in Method: UnitSaleController.checkFsRate",
          error
        );
        return errorResponse(error, 400);
      }

      const fsRate = await UnitSaleRepository.checkFsRateForToday(prounit_id, floc_id, sale_date);
      
      if (fsRate) {
        return successResponse({
          exists: true,
          farm_rate: fsRate.farm_rate,
          sale_rate: fsRate.sale_rate,
        }, "F.S Rate found");
      } else {
        return successResponse({
          exists: false,
          farm_rate: null,
          sale_rate: null,
        }, "F.S Rate not found");
      }
    } catch (err) {
      ErrorLogger.log(
        "Failed to check F.S Rate in Method: UnitSaleController.checkFsRate",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async getPreviousFsRates(req) {
    try {
      const { searchParams } = new URL(req.url);
      const prounit_id = searchParams.get("prounit_id") || searchParams.get("farm_id");
      const floc_id = searchParams.get("floc_id");

      if (!prounit_id || !floc_id) {
        const error = new Error("prounit_id (or farm_id) and floc_id are required");
        ErrorLogger.log(
          "Failed to get previous F.S Rates in Method: UnitSaleController.getPreviousFsRates",
          error
        );
        return errorResponse(error, 400);
      }

      const rates = await UnitSaleRepository.getPreviousFsRates(prounit_id, floc_id);
      const formattedRates = rates.map(rate => ({
        date: rate.rate_date,
        farm_rate: rate.farm_rate,
        sale_rate: rate.sale_rate,
      }));

      return successResponse(formattedRates, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get previous F.S Rates in Method: UnitSaleController.getPreviousFsRates",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async create(req) {
    try {
      const { req_object } = await req.json();
      // Support both prounit_id and farm_id for backward compatibility
      const prounit_id = req_object.prounit_id || req_object.farm_id;
      const { sale_date, floc_id, product_id, price, quantity, set_fs_rate, farm_rate, sale_rate } = req_object;

      if (!sale_date || !prounit_id || !floc_id || !product_id || !price || !quantity) {
        const error = new Error(
          "sale_date, prounit_id (or farm_id), floc_id, product_id, price, and quantity are required in Method: UnitSaleController.create"
        );
        ErrorLogger.log(
          "Failed to create unit sale in Method: UnitSaleController.create",
          error
        );
        return errorResponse(error, 400);
      }

      // If set_fs_rate is true and rates are provided, create daily_fs_rate first
      if (set_fs_rate && farm_rate && sale_rate) {
        const date = new Date(sale_date);
        date.setHours(0, 0, 0, 0);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        // Check if F.S Rate already exists for today
        const existingRate = await prisma.daily_fs_rate.findFirst({
          where: {
            prounit_id: Number(prounit_id),
            floc_id: Number(floc_id),
            rate_date: {
              gte: date,
              lt: nextDay,
            },
          },
        });

        if (!existingRate) {
          await UnitSaleRepository.createDailyFsRate({
            rate_date: sale_date,
            prounit_id: Number(prounit_id),
            floc_id: Number(floc_id),
            farm_rate: Number(farm_rate),
            sale_rate: Number(sale_rate),
            insert_by: req_object.insert_by || "user 1",
            update_by: req_object.update_by || "user 1",
            status: 1,
          });
        }
      }

      const result = await UnitSaleRepository.create({
        sale_date,
        prounit_id: Number(prounit_id),
        floc_id: Number(floc_id),
        farm_rate: farm_rate ? Number(farm_rate) : null,
        sale_rate: sale_rate ? Number(sale_rate) : null,
        product_id: Number(product_id),
        price: Number(price),
        quantity: Number(quantity),
        tax_type: req_object.tax_type || "flat",
        tax_value: req_object.tax_value || 0,
        discount_type: req_object.discount_type || "percentage",
        discount_value: req_object.discount_value || 0,
        total: Number(req_object.total),
        description: req_object.description || null,
        insert_by: req_object.insert_by || "user 1",
        update_by: req_object.update_by || "user 1",
        status: req_object.status ?? 1,
      });

      await RedisService.del("unitSales:all");
      return successResponse(
        { sale_id: result.sale_id },
        "Unit sale created successfully"
      );
    } catch (err) {
      ErrorLogger.log(
        "Failed to create unit sale in Method: UnitSaleController.create",
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
        const error = new Error(
          "sale_id is required in Method: UnitSaleController.update"
        );
        ErrorLogger.log(
          "Failed to update unit sale in Method: UnitSaleController.update",
          error
        );
        return errorResponse(error, 400);
      }

      // Support both prounit_id and farm_id for backward compatibility
      const prounit_id = req_object.prounit_id || req_object.farm_id;
      
      const result = await UnitSaleRepository.update(sale_id, {
        ...req_object,
        prounit_id: prounit_id !== undefined ? Number(prounit_id) : undefined,
        floc_id: req_object.floc_id ? Number(req_object.floc_id) : undefined,
        farm_rate: req_object.farm_rate !== undefined ? (req_object.farm_rate ? Number(req_object.farm_rate) : null) : undefined,
        sale_rate: req_object.sale_rate !== undefined ? (req_object.sale_rate ? Number(req_object.sale_rate) : null) : undefined,
        product_id: req_object.product_id ? Number(req_object.product_id) : undefined,
        price: req_object.price ? Number(req_object.price) : undefined,
        quantity: req_object.quantity ? Number(req_object.quantity) : undefined,
        tax_value: req_object.tax_value !== undefined ? Number(req_object.tax_value) : undefined,
        discount_value: req_object.discount_value !== undefined ? Number(req_object.discount_value) : undefined,
        total: req_object.total ? Number(req_object.total) : undefined,
      });

      await RedisService.del("unitSales:all");
      return successResponse(result, "Unit sale updated successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to update unit sale in Method: UnitSaleController.update",
          err
        );
        return errorResponse(new Error("Sale not found"), 404);
      }
      ErrorLogger.log(
        "Failed to update unit sale in Method: UnitSaleController.update",
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
        ErrorLogger.log(
          "Failed to delete unit sale in Method: UnitSaleController.delete",
          new Error("sale_id is required")
        );
        return errorResponse(new Error("sale_id is required"), 400);
      }

      await UnitSaleRepository.delete(sale_id);

      await RedisService.del("unitSales:all");
      return successResponse({}, "Unit sale deleted successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to delete unit sale in Method: UnitSaleController.delete",
          err
        );
        return errorResponse(new Error("Sale not found"), 404);
      }
      ErrorLogger.log(
        "Failed to delete unit sale in Method: UnitSaleController.delete",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new UnitSaleController();

