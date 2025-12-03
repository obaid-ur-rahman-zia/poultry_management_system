import { successResponse, errorResponse } from "@/app/utils/response";
import AreaRepository from "@/app/repositories/area/areaRepository";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";

class AreaController {
  async readUnassigned() {
    try {
      const data = await AreaRepository.readUnassigned();
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get Unassigned areas in Method: AreaController.readUnassigned",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readAll() {
    const cacheKey = "areas:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Area Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Area Cache Miss");

      const data = await AreaRepository.readAll();
      const nextId = await AreaRepository.readNextId();
      await RedisService.setex(cacheKey, 300, JSON.stringify({ data, nextId }));
      return successResponse({ data, nextId }, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get areas in Method: AreaController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async create(req) {
    try {
      const { req_object } = await req.json();
      const { area_nam } = req_object;
      if (!area_nam) {
        const error = new Error("Missing areaName");
        ErrorLogger.log(
          "Failed` to create area in Method: AreaController.create",
          error
        );
        return errorResponse(new Error("Missing areaName"), 400);
      }
      // Check if area already exists
      const duplicate = await AreaRepository.checkDuplicate(area_nam.trim());
      if (duplicate) {
        const error = new Error("Area already exists");
        ErrorLogger.log(
          "Failed to create area in Method: AreaController.create",
          error
        );
        return errorResponse(error, 400);
      }
      const area = await AreaRepository.create(area_nam.trim());
      await RedisService.del("areas:all");
      return successResponse({ area_id: area.area_id }, "Success");
    } catch (err) {
      if (err.code === "P2002") {
        ErrorLogger.log(
          "Area already exists in Method: AreaController.create",
          err
        );
        return errorResponse(new Error("Area already exists"), 400);
      }
      ErrorLogger.log(
        "Failed to create area in Method: AreaController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { area_id, new_area_nam } = req_object;
      if (!area_id || !new_area_nam) {
        const error = new Error("Area ID and new name are required");
        ErrorLogger.log(
          "Failed to update area in Method: AreaController.update",
          error
        );
        return errorResponse(error, 400);
      }

      const data = await AreaRepository.update(area_id, new_area_nam.trim());
      await RedisService.del("areas:all");
      return successResponse(data, "Area updated");
    } catch (err) {
      if (err.code === "P2002") {
        ErrorLogger.log(
          "Area already exists in Method: AreaController.update",
          err
        );
        return errorResponse(new Error("Area already exists"), 400);
      }
      ErrorLogger.log(
        "Failed to update area in Method: AreaController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new AreaController();
