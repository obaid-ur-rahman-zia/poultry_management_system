import ProductRepository from "@/app/repositories/product/productRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";

class ProductController {
  async readAll(req) {
    const cacheKey = "products:all";
    try {
      // Extract pagination params
      const searchParams = req?.nextUrl?.searchParams || new URL(req?.url || "").searchParams;
      const getAll = searchParams.get("all") === "true";
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "20");
      const skip = (page - 1) * limit;

      // If getAll is true, fetch all products without pagination
      let products, total;
      if (getAll) {
        products = await ProductRepository.readAll();
        total = products.length;
      } else {
        // Get total count and paginated products
        const result = await ProductRepository.readAllWithPagination(skip, limit);
        products = result.data;
        total = result.total;
      }

      const nextId = await ProductRepository.readNextId();

      // Use cache key with pagination to avoid cache conflicts
      const userCacheKey = getAll
        ? `${cacheKey}:all`
        : `${cacheKey}:page:${page}:limit:${limit}`;

      const cachedData = await RedisService.get(userCacheKey);
      if (cachedData) {
        console.log("Product Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Product Cache Miss");

      // If getAll, return all products without pagination structure
      if (getAll) {
        const response = { products, nextId };
        await RedisService.setex(userCacheKey, 300, JSON.stringify(response));
        return successResponse(response, "Success");
      }

      const paginatedResponse = {
        products,
        nextId,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      await RedisService.setex(userCacheKey, 300, JSON.stringify(paginatedResponse));
      return successResponse(paginatedResponse, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get products in Method: ProductController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readById(req) {
    try {
      const { searchParams } = new URL(req.url);
      const product_id = searchParams.get("product_id");
      if (!product_id) {
        const error = new Error("Product ID is required");
        ErrorLogger.log(
          "Failed to get product by id in Method: ProductController.readById",
          error
        );
        return errorResponse(error, 400);
      }

      const result = await ProductRepository.readById(product_id);
      if (!result) {
        const error = new Error("Product not found");
        ErrorLogger.log(
          "Failed to get product by id in Method: ProductController.readById",
          error
        );
        return errorResponse(error, 404);
      }
      return successResponse(result, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get product by id in Method: ProductController.readById",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { product_id } = req_object;
      if (!product_id) {
        const error = new Error("Product ID is required");
        ErrorLogger.log(
          "Failed to update product in Method: ProductController.update",
          error
        );
        return errorResponse(error, 400);
      }

      const updated = await ProductRepository.update(req_object);
      await RedisService.del("products:all");
      return successResponse(
        { productId: updated.product_id },
        "Product updated successfully"
      );
    } catch (err) {
      if (err.code === "P2002") {
        ErrorLogger.log(
          "Product already exists in Method: ProductController.update",
          err
        );
        return errorResponse(new Error("Product already exists"), 400);
      }
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Product not found during update in Method: ProductController.update",
          err
        );
        return errorResponse(new Error("Product not found"), 404);
      }
      ErrorLogger.log(
        "Failed to update product in Method: ProductController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async create(req) {
    try {
      const { req_object } = await req.json();
      const required = [
        "product_title",
        "procategory_id",
        "company_id",
        "purchase_price",
        "sale_price",
      ];

      for (const field of required) {
        if (!req_object[field]) {
          const error = new Error(`${field} is required`);
          ErrorLogger.log(
            "Failed to create product in Method: ProductController.create",
            error
          );
          return errorResponse(error, 400);
        }
      }

      // Check if product already exists
      const duplicate = await ProductRepository.checkDuplicate(
        req_object.product_title
      );
      if (duplicate) {
        const error = new Error("Product already exists");
        ErrorLogger.log(
          "Failed to create product in Method: ProductController.create",
          error
        );
        return errorResponse(error, 400);
      }
      const product = await ProductRepository.create(req_object);
      await RedisService.del("products:all");
      return successResponse(
        { product_id: product.product_id },
        "Product created successfully"
      );
    } catch (err) {
      if (err.code === "P2002") {
        ErrorLogger.log(
          "Product already exists in Method: ProductController.create",
          err
        );
        return errorResponse(new Error("Product already exists"), 400);
      }
      ErrorLogger.log(
        "Failed to create product in Method: ProductController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async delete(req) {
    try {
      const { searchParams } = new URL(req.url);
      const product_id = searchParams.get("product_id");

      if (!product_id) {
        ErrorLogger.log(
          "Failed to delete product in Method: ProductController.delete",
          new Error("product_id is required")
        );
        return errorResponse(new Error("product_id is required"), 400);
      }

      await ProductRepository.delete(product_id);
      await RedisService.del("products:all");
      return successResponse({}, "Product deleted successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to delete product in Method: ProductController.delete",
          err
        );
        return errorResponse(new Error("Product not found"), 404);
      }
      ErrorLogger.log(
        "Failed to delete product in Method: ProductController.delete",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new ProductController();
