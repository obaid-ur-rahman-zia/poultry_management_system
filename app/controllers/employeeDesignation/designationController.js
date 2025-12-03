import designationRepository from "@/app/repositories/employeeDesignation/designationRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";

class DesignationController {
  async create(req) {
    try {
      const { req_object } = await req.json();
      const { designation_nam } = req_object;

      if (!designation_nam?.trim()) {
        const error = new Error("Designation Name is required");
        ErrorLogger.log(
          "Failed to create designation in Method: DesignationController.create",
          error
        );
        return errorResponse(error, 400);
      }

      // Check if designation already exists
      const duplicate = await designationRepository.checkDuplicate(
        designation_nam.trim()
      );
      if (duplicate) {
        const error = new Error("Designation already exists");
        ErrorLogger.log(
          "Failed to create designation in Method: DesignationController.create",
          error
        );
        return errorResponse(error, 400);
      }
      const designation = await designationRepository.create(
        designation_nam.trim()
      );
      await RedisService.del("designations:all");
      return successResponse(
        { designation_id: designation.designation_id },
        "Success"
      );
    } catch (err) {
      if (err.code === "P2002") {
        ErrorLogger.log(
          "Designation already exists in Method: DesignationController.create",
          err
        );
        return errorResponse(new Error("Designation already exists"), 400);
      }
      ErrorLogger.log(
        "Failed to create designation in Method: DesignationController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readAll() {
    const cacheKey = "designations:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Designation Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Designation Cache Miss");
      const data = await designationRepository.readAll();
      await RedisService.setex(cacheKey, 300, JSON.stringify(data));
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to fetch designations in Method: DesignationController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { designation_id, designation_nam } = req_object;
      if (!designation_id || !designation_nam) {
        const error = new Error(
          "designation_id and designation_nam are required in Method: EmployeeDesignationController.update"
        );
        ErrorLogger.log(
          "Failed to update employee designation in Method: EmployeeDesignationController.update",
          error
        );
        return errorResponse(error, 400);
      }

      const updated = await designationRepository.update(req_object);
      await RedisService.del("designations:all");
      return successResponse(updated, "Designation updated successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to update employee designation in Method: EmployeeDesignationController.update",
          err
        );
        return errorResponse(new Error("Employee Designation not found"), 404);
      }
      ErrorLogger.log(
        "Failed to update employee designation in Method: EmployeeDesignationController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new DesignationController();
