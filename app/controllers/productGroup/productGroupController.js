import productGroupRepository from "@/app/repositories/productGroup/productGroupRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";

class ProductGroupController {
  async create(req) {
    try {
      const { req_object } = await req.json();
      const { pgroup_nam } = req_object;

      if (!pgroup_nam?.trim()) {
        const error = new Error("Product Group Name is required");
        ErrorLogger.log(
          "Failed to create product group in Method: ProductGroupController.create",
          error
        );
        return errorResponse(error, 400);
      }
      // Check if product group already exists
      const duplicate = await productGroupRepository.checkDuplicate(
        pgroup_nam.trim()
      );
      if (duplicate) {
        const error = new Error("Product Group already exists");
        ErrorLogger.log(
          "Failed to create product group in Method: ProductGroupController.create",
          error
        );
        return errorResponse(error, 400);
      }

      const productGroup = await productGroupRepository.create(
        pgroup_nam.trim()
      );
      return successResponse({ pgroup_id: productGroup.pgroup_id }, "Success");
    } catch (err) {
      if (err.code === "P2002") {
        ErrorLogger.log(
          "Product Group already exists in Method: ProductGroupController.create",
          err
        );
        return errorResponse(new Error("Product Group already exists"), 400);
      }
      ErrorLogger.log(
        "Failed to create product group in Method: ProductGroupController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readAll() {
    const cacheKey = "productGroups:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Product Group Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Product Group Cache Miss");
      const data = await productGroupRepository.readAll();
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to fetch product groups in Method: ProductGroupController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { pgroup_id, pgroup_nam } = req_object;
      if (!pgroup_id || !pgroup_nam) {
        const error = new Error(
          "pgroup_id and pgroup_nam are required in Method: ProductGroupController.update"
        );
        ErrorLogger.log(
          "Failed to update unit in Method: ProductGroupController.update",
          error
        );
        return errorResponse(error, 400);
      }

      const updated = await productGroupRepository.update(req_object);
      await RedisService.del("productGroups:all");
      return successResponse(updated, "ProductGroup updated successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to update product group in Method: ProductGroupController.update",
          err
        );
        return errorResponse(new Error("ProductGroup not found"), 404);
      }
      ErrorLogger.log(
        "Failed to update product group in Method: ProductGroupController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new ProductGroupController();
