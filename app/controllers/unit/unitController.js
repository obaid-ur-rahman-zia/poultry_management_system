import UnitRepository from "@/app/repositories/unit/unitRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";

class UnitController {
  async create(req) {
    try {
      const { req_object } = await req.json();
      const { prounit_nam, capacity, address } = req_object;

      if (!prounit_nam?.trim()) {
        const error = new Error("Unit Name is required");
        ErrorLogger.log(
          "Error creating unit in Method: UnitController.create",
          error
        );
        return errorResponse(error, 400);
      }

      // Check if unit already exists
      const duplicate = await UnitRepository.checkDuplicate(prounit_nam.trim());
      if (duplicate) {
        const error = new Error("Unit already exists");
        ErrorLogger.log(
          "Failed to create unit in Method: UnitController.create",
          error
        );
        return errorResponse(error, 400);
      }

      const unit = await UnitRepository.create({
        prounit_nam: prounit_nam.trim(),
        capacity: capacity,
        address: address,
      });
      await RedisService.del("units:all");
      return successResponse({ prounit_id: unit.prounit_id }, "Success");
    } catch (err) {
      if (err.code === "P2002") {
        ErrorLogger.log(
          "Unit already exists in Method: UnitController.create",
          err
        );
        return errorResponse(new Error("Unit already exists"), 400);
      }
      ErrorLogger.log(
        "Failed to create unit in Method: UnitController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readAll() {
    const cacheKey = "units:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Unit Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Unit Cache Miss");
      const data = await UnitRepository.readAll();
      await RedisService.setex(cacheKey, 300, JSON.stringify(data));
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to fetch units in Method: UnitController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { prounit_id, prounit_nam, capacity, address } = req_object;
      if (!prounit_id || !prounit_nam) {
        const error = new Error(
          "prounit_id and prounit_nam are required in Method: UnitController.update"
        );
        ErrorLogger.log(
          "Failed to update unit in Method: UnitController.update",
          error
        );
        return errorResponse(error, 400);
      }

      const updated = await UnitRepository.update({
        ...req_object,
        capacity: capacity,
        address: address,
      });
      await RedisService.del("units:all");
      return successResponse(updated, "Unit updated successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to update unit in Method: UnitController.update",
          err
        );
        return errorResponse(new Error("Unit not found"), 404);
      }
      ErrorLogger.log(
        "Failed to update unit in Method: UnitController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new UnitController();
