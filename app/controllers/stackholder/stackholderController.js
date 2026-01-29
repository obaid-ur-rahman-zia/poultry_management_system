
import StackholderRepository from "@/app/repositories/stackholder/stackholderRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";

class StackholderController {
  async readAll() {
    const cacheKey = "stackholders:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Stackholder Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Stackholder Cache Miss");
      const data = await StackholderRepository.readAll();
      await RedisService.setex(cacheKey, 300, JSON.stringify(data));
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get all stackholders in Method: StackholderController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readById(req) {
    try {
      const { searchParams } = new URL(req.url);
      const stackholder_id = searchParams.get("stackholder_id");

      if (!stackholder_id) {
        const error = new Error("stackholder_id is required");
        ErrorLogger.log(
          "Failed to get stackholder by id in Method: StackholderController.readById",
          error
        );
        return errorResponse(error, 400);
      }

      const result = await StackholderRepository.readById(stackholder_id);
      if (!result) {
        ErrorLogger.log(
          "Failed to get stackholder by id in Method: StackholderController.readById",
          new Error("Stackholder not found")
        );
        return errorResponse(new Error("Stackholder not found"), 404);
      }

      return successResponse(result, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get stackholder by id in Method: StackholderController.readById",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async create(req) {
    try {
      const { req_object } = await req.json();
      const { stackholder_nam, stackholder_cnic, stackholder_contact, stackholder_address } = req_object;

      if (!stackholder_nam) {
        const error = new Error("stackholder_nam is required");
        ErrorLogger.log(
          "Failed to create stackholder in Method: StackholderController.create",
          error
        );
        return errorResponse(error, 400);
      }

      // Check for duplicate name
      const duplicate = await StackholderRepository.checkDuplicate(stackholder_nam);
      if (duplicate) {
        const error = new Error("Stackholder with this name already exists");
        ErrorLogger.log(
          "Failed to create stackholder - duplicate name in Method: StackholderController.create",
          error
        );
        return errorResponse(error, 400);
      }

      // Check for duplicate CNIC if provided
      if (stackholder_cnic) {
        const duplicateCnic = await StackholderRepository.readAll();
        const existingCnic = duplicateCnic.find(
          (s) => s.stackholder_cnic && s.stackholder_cnic.toLowerCase() === stackholder_cnic.toLowerCase()
        );
        if (existingCnic) {
          const error = new Error("Stackholder with this CNIC already exists");
          ErrorLogger.log(
            "Failed to create stackholder - duplicate CNIC in Method: StackholderController.create",
            error
          );
          return errorResponse(error, 400);
        }
      }

      const result = await StackholderRepository.create({
        stackholder_nam,
        stackholder_cnic,
        stackholder_contact,
        stackholder_address,
        insert_by: req_object.insert_by || "user 1",
        update_by: req_object.update_by || "user 1",
        status: req_object.status ?? 1,
      });

      await RedisService.del("stackholders:all");
      return successResponse(
        {
          stackholder_id: result.stackholder_id,
          stackholder_nam: result.stackholder_nam,
        },
        "Stackholder created successfully"
      );
    } catch (err) {
      if (err.code === "P2002") {
        return errorResponse(
          new Error("Stackholder with this name or CNIC already exists"),
          400
        );
      }
      ErrorLogger.log(
        "Failed to create stackholder in Method: StackholderController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { stackholder_id, stackholder_nam } = req_object;

      if (!stackholder_id || !stackholder_nam) {
        const error = new Error("stackholder_id and stackholder_nam are required");
        ErrorLogger.log(
          "Failed to update stackholder in Method: StackholderController.update",
          error
        );
        return errorResponse(error, 400);
      }

      // Check for duplicate name (excluding current stackholder)
      const duplicate = await StackholderRepository.checkDuplicate(stackholder_nam, stackholder_id);
      if (duplicate) {
        const error = new Error("Stackholder with this name already exists");
        ErrorLogger.log(
          "Failed to update stackholder - duplicate name in Method: StackholderController.update",
          error
        );
        return errorResponse(error, 400);
      }

      const result = await StackholderRepository.update(stackholder_id, {
        ...req_object,
        update_by: req_object.update_by || "user 1",
      });

      await RedisService.del("stackholders:all");
      return successResponse(result, "Stackholder updated successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to update stackholder in Method: StackholderController.update",
          err
        );
        return errorResponse(new Error("Stackholder not found"), 404);
      }
      ErrorLogger.log(
        "Failed to update stackholder in Method: StackholderController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async delete(req) {
    try {
      const { searchParams } = new URL(req.url);
      const stackholder_id = searchParams.get("stackholder_id");

      if (!stackholder_id) {
        ErrorLogger.log(
          "Failed to delete stackholder in Method: StackholderController.delete",
          new Error("stackholder_id is required")
        );
        return errorResponse(new Error("stackholder_id is required"), 400);
      }

      await StackholderRepository.delete(stackholder_id);
      await RedisService.del("stackholders:all");
      return successResponse({}, "Stackholder deleted successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to delete stackholder in Method: StackholderController.delete",
          err
        );
        return errorResponse(new Error("Stackholder not found"), 404);
      }
      ErrorLogger.log(
        "Failed to delete stackholder in Method: StackholderController.delete",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new StackholderController();



