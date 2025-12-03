import customerGroupRepository from "@/app/repositories/customerGroup/customerGroupRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";

class CustomerGroupController {
  async create(req) {
    try {
      const { req_object } = await req.json();
      const { cgroup_nam } = req_object;

      if (!cgroup_nam?.trim()) {
        const error = new Error("Customer Group Name is required");
        ErrorLogger.log(
          "Failed to create customer group in Method: CustomerGroupController.create",
          error
        );
        return errorResponse(error, 400);
      }

      // Check if customer group already exists
      const duplicate = await customerGroupRepository.checkDuplicate(
        cgroup_nam.trim()
      );
      if (duplicate) {
        const error = new Error("Customer Group already exists");
        ErrorLogger.log(
          "Failed to create customer group in Method: CustomerGroupController.create",
          error
        );
        return errorResponse(error, 400);
      }
      const customerGroup = await customerGroupRepository.create(
        cgroup_nam.trim()
      );
      await RedisService.del("customerGroups:all");
      return successResponse({ cgroup_id: customerGroup.cgroup_id }, "Success");
    } catch (err) {
      if (err.code === "P2002") {
        ErrorLogger.log(
          "Customer Group already exists in Method: CustomerGroupController.create",
          err
        );
        return errorResponse(new Error("Customer Group already exists"), 400);
      }
      ErrorLogger.log(
        "Failed to create customer group in Method: CustomerGroupController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readAll() {
    const cacheKey = "customerGroups:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Customer Group Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Customer Group Cache Miss");
      const data = await customerGroupRepository.readAll();
      await RedisService.setex(cacheKey, 300, JSON.stringify(data));
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to fetch customer groups ib Method: CustomerGroupController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { cgroup_id, cgroup_nam } = req_object;
      if (!cgroup_id || !cgroup_nam) {
        const error = new Error(
          "cgroup_id and cgroup_nam are required in Method: CustomerGroupController.update"
        );
        ErrorLogger.log(
          "Failed to update customer group in Method: CustomerGroupController.update",
          error
        );
        return errorResponse(error, 400);
      }

      const updated = await customerGroupRepository.update(req_object);
      await RedisService.del("customerGroups:all");
      return successResponse(updated, "Customer Group updated successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to update customer group in Method: CustomerGroupController.update",
          err
        );
        return errorResponse(new Error("Customer Group not found"), 404);
      }
      ErrorLogger.log(
        "Failed to update customer group in Method: CustomerGroupController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new CustomerGroupController();
