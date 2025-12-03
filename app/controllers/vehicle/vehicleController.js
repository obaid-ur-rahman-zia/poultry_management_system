import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import VehicleRepository from "@/app/repositories/vehicle/vehicleRepository.js";
import RedisService from "@/app/utils/redis";

class VehicleController {
  async readAll() {
    const cacheKey = "vehicles:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Vehicle Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Vehicle Cache Miss");
      const vehicles = await VehicleRepository.readAll();
      const nextId = await VehicleRepository.readNextId();
      await RedisService.setex(
        cacheKey,
        300,
        JSON.stringify({ vehicles, nextId })
      );
      return successResponse({ vehicles, nextId }, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get vehicles in Method: VehicleController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readUnassigned() {
    try {
      const vehicles = await VehicleRepository.readUnassigned();
      return successResponse({ vehicles }, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get vehicles in Method: VehicleController.readUnassigned",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async create(req) {
    try {
      const { req_object } = await req.json();
      if (
        !req_object.vehicle_nam ||
        !req_object.vehicle_plate ||
        !req_object.vehicle_type_id
      ) {
        const error = new Error(
          "vehicle_nam, vehicle_plate, vehicle_type_id are required"
        );
        ErrorLogger.log(
          "Failed to create vehicle in Method: VehicleController.create",
          error
        );
        return errorResponse(error, 400);
      }
      // Check if vehicle already exists
      const duplicate = await VehicleRepository.checkDuplicate(
        req_object.vehicle_plate
      );
      if (duplicate) {
        const error = new Error("Vehicle already exists");
        ErrorLogger.log(
          "Failed to create vehicle in Method: VehicleController.create",
          error
        );
        return errorResponse(error, 400);
      }
      const vehicle = await VehicleRepository.create(req_object);
      await RedisService.del("vehicles:all");
      return successResponse(vehicle, "Vehicle created successfully");
    } catch (err) {
      if (err.code === "P2002") {
        ErrorLogger.log(
          "Vehicle or driver or deliveryman already exists during create in Method: VehicleController.create",
          err
        );
        return errorResponse(
          new Error("Vehicle or driver or deliveryman already exists"),
          400
        );
      }
      ErrorLogger.log(
        "Failed to create vehicle in Method: VehicleController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { vehicle_id } = req_object;
      if (!vehicle_id) {
        const error = new Error("vehicle_id is required");
        ErrorLogger.log(
          "Failed to update vehicle in Method: VehicleController.update",
          error
        );
        return errorResponse(error, 400);
      }

      console.log(req_object);

      const updated = await VehicleRepository.update(req_object);
      await RedisService.del("vehicles:all");
      return successResponse(
        { vehicleId: updated.vehicle_id },
        "Vehicle updated successfully"
      );
    } catch (err) {
      if (err.code === "P2002") {
        ErrorLogger.log(
          "Vehicle or Driver or DeliveryMan already exists during update in Method: VehicleController.update",
          err
        );
        return errorResponse(
          new Error("Vehicle or deliveryman or driver already exists"),
          400
        );
      }
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Vehicle not found during update in Method: VehicleController.update",
          err
        );
        return errorResponse(new Error("Vehicle not found"), 404);
      }
      ErrorLogger.log(
        "Failed to update vehicle in Method: VehicleController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readById(req) {
    try {
      const { searchParams } = new URL(req.url);
      const vehicle_id = searchParams.get("vehicle_id");

      if (!vehicle_id) {
        const error = new Error("vehicle_id is required");
        ErrorLogger.log(
          "Failed to get vehicle by id in Method: VehicleController.readById",
          error
        );
        return errorResponse(error, 400);
      }

      const vehicle = await VehicleRepository.readById(vehicle_id);
      return successResponse(vehicle, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get vehicle by id in Method: VehicleController.readById",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new VehicleController();
