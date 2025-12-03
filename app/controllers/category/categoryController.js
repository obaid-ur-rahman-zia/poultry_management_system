import CategoryRepository from "@/app/repositories/category/categoryRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";

class CategoryController {
  async create(req) {
    try {
      const { req_object } = await req.json();
      const { procategory_nam } = req_object;
      if (!procategory_nam?.trim()) {
        const error = new Error("Category Name is required");
        ErrorLogger.log(
          "Category Name is missing in Method: CategoryController.create",
          error
        );
        return errorResponse(error, 400);
      }
      // Check if category already exists
      const duplicate = await CategoryRepository.checkDuplicate(
        procategory_nam.trim()
      );
      if (duplicate) {
        const error = new Error("Category already exists");
        ErrorLogger.log(
          "Failed to create category in Method: CategoryController.create",
          error
        );
        return errorResponse(error, 400);
      }

      const category = await CategoryRepository.create(req_object);
      await RedisService.del("categories:all");
      return successResponse(
        { procategory_id: category.procategory_id },
        "Success"
      );
    } catch (err) {
      if (err.code === "P2002") {
        ErrorLogger.log(
          "Category already exists in Method: CategoryController.create",
          err
        );
        return errorResponse(new Error("Category already exists"), 400);
      }
      ErrorLogger.log(
        "Failed to create category in Method: CategoryController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readAll() {
    const cacheKey = "categories:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Category Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Category Cache Miss");
      const data = await CategoryRepository.readAll();
      await RedisService.setex(cacheKey, 300, JSON.stringify(data));
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Error fetching categories in Method: CategoryController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { procategory_id, procategory_nam } = req_object;
      if (!procategory_id || !procategory_nam) {
        const error = new Error(
          "procategory_id and procategory_nam are required in Method: CategoryController.update"
        );
        ErrorLogger.log(
          "Failed to update category in Method: CategoryController.update",
          error
        );
        return errorResponse(error, 400);
      }

      const updated = await CategoryRepository.update(
        procategory_id,
        req_object
      );
      await RedisService.del("categories:all");
      return successResponse(updated, "Category updated successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to update category in Method: CategoryController.update",
          err
        );
        return errorResponse(new Error("Category not found"), 404);
      }
      ErrorLogger.log(
        "Failed to update category in Method: CategoryController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new CategoryController();
