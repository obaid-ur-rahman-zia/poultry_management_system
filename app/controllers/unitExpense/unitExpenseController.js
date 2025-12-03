import UnitExpenseRepository from "@/app/repositories/unitExpense/unitExpenseRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";

class UnitExpenseController {
  async readAll() {
    const cacheKey = "unitExpenses:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Unit Expense Cache Hit");
        return successResponse(JSON.parse(cachedData), "Success");
      }
      console.log("Unit Expense Cache Miss");
      const data = await UnitExpenseRepository.readAll();
      await RedisService.setex(cacheKey, 300, JSON.stringify(data));
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get all unit expenses in Method: UnitExpenseController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readById(req) {
    try {
      const { searchParams } = new URL(req.url);
      const expense_id = searchParams.get("expense_id");

      if (!expense_id) {
        const error = new Error("expense_id is required");
        ErrorLogger.log(
          "Failed to get unit expense by id in Method: UnitExpenseController.readById",
          error
        );
        return errorResponse(error, 400);
      }

      const result = await UnitExpenseRepository.readById(expense_id);
      if (!result) {
        ErrorLogger.log(
          "Failed to get unit expense by id in Method: UnitExpenseController.readById",
          new Error("Expense not found")
        );
        return errorResponse(new Error("Expense not found"), 404);
      }

      return successResponse(result, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get unit expense by id in Method: UnitExpenseController.readById",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async create(req) {
    try {
      const { req_object } = await req.json();
      const { expense_date, farm_id, floc_id, product_id, price, quantity, total } = req_object;

      if (!expense_date || !farm_id || !floc_id || !product_id || !price || !quantity) {
        const error = new Error(
          "expense_date, farm_id, floc_id, product_id, price, and quantity are required in Method: UnitExpenseController.create"
        );
        ErrorLogger.log(
          "Failed to create unit expense in Method: UnitExpenseController.create",
          error
        );
        return errorResponse(error, 400);
      }

      const result = await UnitExpenseRepository.create({
        expense_date,
        farm_id: Number(farm_id),
        floc_id: Number(floc_id),
        product_id: Number(product_id),
        price: Number(price),
        quantity: Number(quantity),
        tax_type: req_object.tax_type || "flat",
        tax_value: req_object.tax_value || 0,
        discount_type: req_object.discount_type || "percentage",
        discount_value: req_object.discount_value || 0,
        total: Number(total),
        description: req_object.description || null,
        insert_by: req_object.insert_by || "user 1",
        update_by: req_object.update_by || "user 1",
        status: req_object.status ?? 1,
      });

      await RedisService.del("unitExpenses:all");
      return successResponse(
        { expense_id: result.expense_id },
        "Unit expense created successfully"
      );
    } catch (err) {
      ErrorLogger.log(
        "Failed to create unit expense in Method: UnitExpenseController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { expense_id } = req_object;

      if (!expense_id) {
        const error = new Error(
          "expense_id is required in Method: UnitExpenseController.update"
        );
        ErrorLogger.log(
          "Failed to update unit expense in Method: UnitExpenseController.update",
          error
        );
        return errorResponse(error, 400);
      }

      const result = await UnitExpenseRepository.update(expense_id, {
        ...req_object,
        farm_id: req_object.farm_id ? Number(req_object.farm_id) : undefined,
        floc_id: req_object.floc_id ? Number(req_object.floc_id) : undefined,
        product_id: req_object.product_id ? Number(req_object.product_id) : undefined,
        price: req_object.price ? Number(req_object.price) : undefined,
        quantity: req_object.quantity ? Number(req_object.quantity) : undefined,
        tax_value: req_object.tax_value !== undefined ? Number(req_object.tax_value) : undefined,
        discount_value: req_object.discount_value !== undefined ? Number(req_object.discount_value) : undefined,
        total: req_object.total ? Number(req_object.total) : undefined,
      });

      await RedisService.del("unitExpenses:all");
      return successResponse(result, "Unit expense updated successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to update unit expense in Method: UnitExpenseController.update",
          err
        );
        return errorResponse(new Error("Expense not found"), 404);
      }
      ErrorLogger.log(
        "Failed to update unit expense in Method: UnitExpenseController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async delete(req) {
    try {
      const { searchParams } = new URL(req.url);
      const expense_id = searchParams.get("expense_id");

      if (!expense_id) {
        ErrorLogger.log(
          "Failed to delete unit expense in Method: UnitExpenseController.delete",
          new Error("expense_id is required")
        );
        return errorResponse(new Error("expense_id is required"), 400);
      }

      await UnitExpenseRepository.delete(expense_id);

      await RedisService.del("unitExpenses:all");
      return successResponse({}, "Unit expense deleted successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to delete unit expense in Method: UnitExpenseController.delete",
          err
        );
        return errorResponse(new Error("Expense not found"), 404);
      }
      ErrorLogger.log(
        "Failed to delete unit expense in Method: UnitExpenseController.delete",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new UnitExpenseController();

