import FarmRepository from "@/app/repositories/farm/farmRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";

class FarmController {
  async readAll() {
    const cacheKey = "farms:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Farm Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Farm Cache Miss");
      const data = await FarmRepository.readAll();
      await RedisService.setex(cacheKey, 300, JSON.stringify(data));
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get all farms in Method: FarmController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readById(req) {
    try {
      const { searchParams } = new URL(req.url);
      const farm_id = searchParams.get("farm_id");

      if (!farm_id) {
        const error = new Error("farm_id is required");
        ErrorLogger.log(
          "Failed to get farm by id in Method: FarmController.readById",
          error
        );
        return errorResponse(error, 400);
      }

      const result = await FarmRepository.readById(farm_id);
      if (!result) {
        ErrorLogger.log(
          "Failed to get farm by id in Method: FarmController.readById",
          new Error("Farm not found")
        );
        return errorResponse(new Error("Farm not found"), 404);
      }

      return successResponse(result, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get farm by id in Method: FarmController.readById",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async create(req) {
    try {
      const { req_object } = await req.json();
      const { farm_nam } = req_object;

      if (!farm_nam?.trim()) {
        const error = new Error("Farm name is required");
        ErrorLogger.log(
          "Failed to create farm in Method: FarmController.create",
          error
        );
        return errorResponse(error, 400);
      }

      // Check if farm already exists
      const duplicate = await FarmRepository.checkDuplicate(farm_nam);
      if (duplicate) {
        const error = new Error("Farm already exists");
        ErrorLogger.log(
          "Failed to create farm in Method: FarmController.create",
          error
        );
        return errorResponse(error, 400);
      }

      const farm = await FarmRepository.create(req_object);
      await RedisService.del("farms:all");
      return successResponse(
        { farm_id: farm.farm_id },
        "Farm created successfully"
      );
    } catch (err) {
      if (err.code === "P2002") {
        ErrorLogger.log(
          "Farm already exists in Method: FarmController.create",
          err
        );
        return errorResponse(new Error("Farm already exists"), 400);
      }
      ErrorLogger.log(
        "Failed to create farm in Method: FarmController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { farm_id, farm_nam } = req_object;

      if (!farm_id || !farm_nam) {
        const error = new Error(
          "farm_id and farm_nam are required in Method: FarmController.update"
        );
        ErrorLogger.log(
          "Failed to update farm in Method: FarmController.update",
          error
        );
        return errorResponse(error, 400);
      }

      const updated = await FarmRepository.update(farm_id, req_object);
      await RedisService.del("farms:all");
      return successResponse(updated, "Farm updated successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to update farm in Method: FarmController.update",
          err
        );
        return errorResponse(new Error("Farm not found"), 404);
      }
      ErrorLogger.log(
        "Failed to update farm in Method: FarmController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async delete(req) {
    try {
      const { searchParams } = new URL(req.url);
      const farm_id = searchParams.get("farm_id");

      if (!farm_id) {
        ErrorLogger.log(
          "Failed to delete farm in Method: FarmController.delete",
          new Error("farm_id is required")
        );
        return errorResponse(new Error("farm_id is required"), 400);
      }

      await FarmRepository.delete(farm_id);
      await RedisService.del("farms:all");
      return successResponse({}, "Farm deleted successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to delete farm in Method: FarmController.delete",
          err
        );
        return errorResponse(new Error("Farm not found"), 404);
      }
      ErrorLogger.log(
        "Failed to delete farm in Method: FarmController.delete",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new FarmController();

