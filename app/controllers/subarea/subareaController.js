import { successResponse, errorResponse } from "@/app/utils/response";
import subareaRepository from "../../repositories/subarea/subareaRepository";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";

class SubareaController {
  async create(req) {
    try {
      const { req_object } = await req.json();
      const { area_id, subarea_nam } = req_object;

      if (!area_id || !subarea_nam.trim()) {
        const error = new Error("Missing areaId or subareaName");
        ErrorLogger.log(
          "Failed to create subarea in Method: SubareaController.create",
          error
        );
        return errorResponse(error, 400);
      }

      // Check if subarea already exists
      const duplicate = await subareaRepository.checkDuplicate(
        subarea_nam.trim()
      );
      if (duplicate) {
        const error = new Error("Subarea already exists");
        ErrorLogger.log(
          "Failed to create subarea in Method: SubareaController.create",
          error
        );
        return errorResponse(error, 400);
      }
      const subarea = await subareaRepository.create(
        area_id,
        subarea_nam.trim()
      );
      await RedisService.del("subareas:all");
      return successResponse({ subarea_id: subarea.subarea_id }, "Success");
    } catch (err) {
      if (err.code === "P2002") {
        ErrorLogger.log(
          "Subarea already exists in Method: SubareaController.create",
          err
        );
        return errorResponse(new Error("Subarea already exists"), 400);
      }
      ErrorLogger.log("Failed to create subarea", err);
      return errorResponse(err, 500);
    }
  }

  async readArea(req) {
    try {
      const { searchParams } = new URL(req.url);
      const subarea_id = searchParams.get("subarea_id");
      if (!subarea_id) {
        const error = new Error("Missing subareaId");
        ErrorLogger.log(
          "Failed to get Area by subarea in Method: SubareaController.readArea",
          error
        );
        return errorResponse(error, 400);
      }

      const data = await subareaRepository.readArea(subarea_id);
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Faled to get Area by subarea in Method: SubareaController.readArea",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readAll() {
    const cacheKey = "subareas:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Subarea Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Subarea Cache Miss");
      const data = await subareaRepository.readAll();
      await RedisService.setex(cacheKey, 300, JSON.stringify(data));
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to fetch subareas in Method: SubareaController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readByArea(req) {
    try {
      const { searchParams } = new URL(req.url);
      const area_id = searchParams.get("area_id");

      if (!area_id) {
        const error = new Error("areaId required");
        ErrorLogger.log(
          "Failed to get subareas by area in Method: SubareaController.readByArea",
          error
        );
        return errorResponse(error, 400);
      }

      const data = await subareaRepository.readByArea(area_id);
      const nextId = await subareaRepository.readNextId();
      return successResponse({ data, nextId }, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get subareas by area in Method: SubareaController.readByArea",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { subarea_id, new_subarea_nam } = req_object;

      if (!subarea_id || !new_subarea_nam?.trim()) {
        const error = new Error("Missing subareaId or newSubareaName");
        ErrorLogger.log(
          "Failed to update subarea in Method: SubareaController.update",
          error
        );
        return errorResponse(error, 400);
      }

      const data = await subareaRepository.update(
        subarea_id,
        new_subarea_nam.trim()
      );
      await RedisService.del("subareas:all");
      return successResponse(
        {
          subarea_id: data.subarea_id,
          subarea_nam: data.subarea_nam,
        },
        "Success"
      );
    } catch (err) {
      if (err.code === "P2002") {
        ErrorLogger.log(
          "Subarea already exists in Method: SubareaController.update",
          err
        );
        return errorResponse(new Error("Subarea already exists"), 400);
      }
      ErrorLogger.log(
        "Failed to update subarea in Method: SubareaController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new SubareaController();
