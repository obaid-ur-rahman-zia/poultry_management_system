import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import VehicleTypeRepository from "@/app/repositories/vehicleType/vehicleTypeRepository.js";
import RedisService from "@/app/utils/redis";

class VehicleTypeController {
  async create(req) {
    try {
      const { req_object } = await req.json();
      if (!req_object.vehicle_type_nam) {
        const error = new Error("vehicle_type_nam is required");
        ErrorLogger.log(
          "Failed to create vehicle type in Method: VehicleTypeController.createVehicleType",
          error
        );
        return errorResponse(error, 400);
      }
      // Check if vehicle type already exists
      const duplicate = await VehicleTypeRepository.checkDuplicate(
        req_object.vehicle_type_nam
      );
      if (duplicate) {
        const error = new Error("Vehicle type already exists");
        ErrorLogger.log(
          "Failed to create vehicle type in Method: VehicleTypeController.create",
          error
        );
        return errorResponse(error, 400);
      }
      const vehicleType = await VehicleTypeRepository.create(req_object);
      await RedisService.del("vehicleTypes:all");
      return successResponse(vehicleType, "Vehicle type created successfully");
    } catch (err) {
      if (err.code === "P2002") {
        ErrorLogger.log(
          "Vehicle type already exists in Method: VehicleTypeController.create",
          err
        );
        return errorResponse(new Error("Vehicle type already exists"), 400);
      }
      ErrorLogger.log(
        "Failed to create vehicle type in Method: VehicleTypeController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readAll() {
    const cacheKey = "vehicleTypes:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Vehicle Type Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Vehicle Type Cache Miss");
      const vehicleTypes = await VehicleTypeRepository.readAll();
      await RedisService.setex(cacheKey, 300, JSON.stringify(vehicleTypes));
      return successResponse(vehicleTypes, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get vehicle types in Method: VehicleTypeController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { vehicle_type_id, vehicle_type_nam } = req_object;
      if (!vehicle_type_id || !vehicle_type_nam) {
        const error = new Error(
          "vehicle_type_id and vehicle_type_nam are required in Method: VehicleTypeController.update"
        );
        ErrorLogger.log(
          "Failed to update employee vehicle_type in Method: VehicleTypeController.update",
          error
        );
        return errorResponse(error, 400);
      }

      const updated = await VehicleTypeRepository.update(req_object);
      await RedisService.del("vehicleTypes:all");
      return successResponse(updated, "Type updated successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to update employee vehicle_type in Method: VehicleTypeController.update",
          err
        );
        return errorResponse(new Error("Vehicle Type not found"), 404);
      }
      ErrorLogger.log(
        "Failed to update employee vehicle_type in Method: VehicleTypeController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new VehicleTypeController();
