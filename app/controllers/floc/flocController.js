import FlocRepository from "@/app/repositories/floc/flocRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";

class FlocController {
  async readAll() {
    const cacheKey = "flocs:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Floc Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Floc Cache Miss");
      const data = await FlocRepository.readAll();
      await RedisService.setex(cacheKey, 300, JSON.stringify(data));
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get all flocs in Method: FlocController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readById(req) {
    try {
      const { searchParams } = new URL(req.url);
      const floc_id = searchParams.get("floc_id");

      if (!floc_id) {
        const error = new Error("floc_id is required");
        ErrorLogger.log(
          "Failed to get floc by id in Method: FlocController.readById",
          error
        );
        return errorResponse(error, 400);
      }

      const result = await FlocRepository.readById(floc_id);
      if (!result) {
        ErrorLogger.log(
          "Failed to get floc by id in Method: FlocController.readById",
          new Error("Floc not found")
        );
        return errorResponse(new Error("Floc not found"), 404);
      }

      return successResponse(result, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get floc by id in Method: FlocController.readById",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readByFarmId(req) {
    try {
      const { searchParams } = new URL(req.url);
      const farm_id = searchParams.get("farm_id");

      if (!farm_id) {
        const error = new Error("farm_id is required");
        ErrorLogger.log(
          "Failed to get flocs by farm id in Method: FlocController.readByFarmId",
          error
        );
        return errorResponse(error, 400);
      }

      const data = await FlocRepository.readByFarmId(farm_id);
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get flocs by farm id in Method: FlocController.readByFarmId",
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
      const { starting_date, stackholders } = req_object;

      if (!prounit_id || !starting_date || !stackholders || !Array.isArray(stackholders)) {
        const error = new Error(
          "prounit_id (or farm_id), starting_date, and stackholders are required in Method: FlocController.create"
        );
        ErrorLogger.log(
          "Failed to create floc in Method: FlocController.create",
          error
        );
        return errorResponse(error, 400);
      }

      // Validate stackholders percentage totals 100%
      const totalPercentage = stackholders.reduce(
        (sum, sh) => sum + (parseFloat(sh.percentage) || 0),
        0
      );
      if (Math.abs(totalPercentage - 100) > 0.01) {
        const error = new Error("Stackholders percentage must total exactly 100%");
        ErrorLogger.log(
          "Failed to create floc in Method: FlocController.create",
          error
        );
        return errorResponse(error, 400);
      }

      // Check if unit already has an active floc
      const activeFloc = await FlocRepository.findActiveFlocByFarmId(prounit_id);
      if (activeFloc) {
        const error = new Error(
          "Unit already has an active floc. Please end the current floc first."
        );
        ErrorLogger.log(
          "Failed to create floc in Method: FlocController.create",
          error
        );
        return errorResponse(error, 400);
      }

      // Ensure prounit_id is set in req_object
      req_object.prounit_id = prounit_id;

      // Validate dates
      if (req_object.ending_date) {
        const startDate = new Date(starting_date);
        const endDate = new Date(req_object.ending_date);
        if (startDate > endDate) {
          const error = new Error("Ending date must be after starting date");
          ErrorLogger.log(
            "Failed to create floc in Method: FlocController.create",
            error
          );
          return errorResponse(error, 400);
        }
      }

      const floc = await FlocRepository.create(req_object);
      await RedisService.del("flocs:all");
      return successResponse(
        { floc_id: floc.floc_id },
        "Floc created successfully"
      );
    } catch (err) {
      ErrorLogger.log(
        "Failed to create floc in Method: FlocController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { floc_id } = req_object;

      if (!floc_id) {
        const error = new Error(
          "floc_id is required in Method: FlocController.update"
        );
        ErrorLogger.log(
          "Failed to update floc in Method: FlocController.update",
          error
        );
        return errorResponse(error, 400);
      }

      // If updating stackholders, validate percentage
      if (req_object.stackholders && Array.isArray(req_object.stackholders)) {
        const totalPercentage = req_object.stackholders.reduce(
          (sum, sh) => sum + (parseFloat(sh.percentage) || 0),
          0
        );
        if (Math.abs(totalPercentage - 100) > 0.01) {
          const error = new Error("Stackholders percentage must total exactly 100%");
          ErrorLogger.log(
            "Failed to update floc in Method: FlocController.update",
            error
          );
          return errorResponse(error, 400);
        }
      }

      // If updating prounit_id or farm_id, check if new unit has active floc
      const prounit_id = req_object.prounit_id || req_object.farm_id;
      if (prounit_id) {
        const currentFloc = await FlocRepository.readById(floc_id);
        const currentProunitId = currentFloc?.prounit_id || currentFloc?.farm_id;
        if (currentFloc && currentProunitId !== prounit_id) {
          const activeFloc = await FlocRepository.findActiveFlocByFarmId(prounit_id);
          if (activeFloc && activeFloc.floc_id !== Number(floc_id)) {
            const error = new Error(
              "Unit already has an active floc. Please end the current floc first."
            );
            ErrorLogger.log(
              "Failed to update floc in Method: FlocController.update",
              error
            );
            return errorResponse(error, 400);
          }
        }
        // Ensure prounit_id is set in req_object
        req_object.prounit_id = prounit_id;
      }

      // Validate dates if both are provided
      if (req_object.starting_date && req_object.ending_date) {
        const startDate = new Date(req_object.starting_date);
        const endDate = new Date(req_object.ending_date);
        if (startDate > endDate) {
          const error = new Error("Ending date must be after starting date");
          ErrorLogger.log(
            "Failed to update floc in Method: FlocController.update",
            error
          );
          return errorResponse(error, 400);
        }
      }

      const updated = await FlocRepository.update(floc_id, req_object);
      await RedisService.del("flocs:all");
      return successResponse(updated, "Floc updated successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to update floc in Method: FlocController.update",
          err
        );
        return errorResponse(new Error("Floc not found"), 404);
      }
      ErrorLogger.log(
        "Failed to update floc in Method: FlocController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async clearEndingDate(req) {
    try {
      const { req_object } = await req.json();
      const { floc_id, clear_description } = req_object;

      if (!floc_id || !clear_description?.trim()) {
        const error = new Error(
          "floc_id and clear_description are required in Method: FlocController.clearEndingDate"
        );
        ErrorLogger.log(
          "Failed to clear ending date in Method: FlocController.clearEndingDate",
          error
        );
        return errorResponse(error, 400);
      }

      const updated = await FlocRepository.clearEndingDate(floc_id, clear_description);
      await RedisService.del("flocs:all");
      return successResponse(updated, "Ending date cleared successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to clear ending date in Method: FlocController.clearEndingDate",
          err
        );
        return errorResponse(new Error("Floc not found"), 404);
      }
      ErrorLogger.log(
        "Failed to clear ending date in Method: FlocController.clearEndingDate",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async delete(req) {
    try {
      const { searchParams } = new URL(req.url);
      const floc_id = searchParams.get("floc_id");

      if (!floc_id) {
        ErrorLogger.log(
          "Failed to delete floc in Method: FlocController.delete",
          new Error("floc_id is required")
        );
        return errorResponse(new Error("floc_id is required"), 400);
      }

      await FlocRepository.delete(floc_id);
      await RedisService.del("flocs:all");
      return successResponse({}, "Floc deleted successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to delete floc in Method: FlocController.delete",
          err
        );
        return errorResponse(new Error("Floc not found"), 404);
      }
      ErrorLogger.log(
        "Failed to delete floc in Method: FlocController.delete",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new FlocController();

