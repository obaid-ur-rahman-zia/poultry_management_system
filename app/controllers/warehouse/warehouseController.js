import WarehouseRepository from "@/app/repositories/warehouse/warehouseRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";

class WarehouseController {
  async create(req) {
    try {
      const { req_object } = await req.json();
      const { warehouse_nam } = req_object;

      if (!warehouse_nam?.trim()) {
        const error = new Error("Warehouse Name is required");
        ErrorLogger.log(
          "Failed to create warehouse in Method: WarehouseController.create",
          error
        );
        return errorResponse(error, 400);
      }
      // Check if warehouse already exists
      const duplicate = await WarehouseRepository.checkDuplicate(
        warehouse_nam.trim()
      );
      if (duplicate) {
        const error = new Error("Warehouse already exists");
        ErrorLogger.log(
          "Failed to create warehouse in Method: WarehouseController.create",
          error
        );
        return errorResponse(error, 400);
      }
      const warehouse = await WarehouseRepository.create(warehouse_nam.trim());
      await RedisService.del("warehouses:all");
      return successResponse(
        { warehouse_id: warehouse.warehouse_id },
        "Success"
      );
    } catch (err) {
      if (err.code === "P2002") {
        ErrorLogger.log(
          "Warehouse already exists in Method: WarehouseController.create",
          err
        );
        return errorResponse(new Error("Warehouse already exists"), 400);
      }
      ErrorLogger.log(
        "Failed to create warehouse in Method: WarehouseController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readAll() {
    const cacheKey = "warehouses:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Warehouse Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Warehouse Cache Miss");
      const data = await WarehouseRepository.readAll();
      await RedisService.setex(cacheKey, 300, JSON.stringify(data));
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to fetch warehouses in Method: WarehouseController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }
  async update(req) {
    try {
      const { req_object } = await req.json();
      const { warehouse_id, warehouse_nam } = req_object;
      if (!warehouse_id || !warehouse_nam) {
        const error = new Error(
          "warehouse_id and warehouse_nam are required in Method: WarehouseController.update"
        );
        ErrorLogger.log(
          "Failed to update warehouse in Method: WarehouseController.update",
          error
        );
        return errorResponse(error, 400);
      }

      const updated = await WarehouseRepository.update(req_object);
      await RedisService.del("warehouses:all");
      return successResponse(updated, "Warehouse updated successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to update warehouse in Method: WarehouseController.update",
          err
        );
        return errorResponse(new Error("Warehouse not found"), 404);
      }
      ErrorLogger.log(
        "Failed to update warehouse in Method: WarehouseController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new WarehouseController();
