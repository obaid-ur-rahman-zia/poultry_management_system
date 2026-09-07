import ShopCustomerRepository from "@/app/repositories/shop/shopCustomerRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";

class ShopCustomerController {
  async readAll(req) {
    try {
      const data = await ShopCustomerRepository.readAll();
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log("ShopCustomerController.readAll", err);
      return errorResponse(err, 500);
    }
  }

  async create(req) {
    try {
      const { req_object } = await req.json();
      if (!req_object?.customer_nam?.trim()) {
        return errorResponse(new Error("customer_nam is required"), 400);
      }
      const data = await ShopCustomerRepository.create(req_object);
      return successResponse(data, "Shop customer created successfully", 201);
    } catch (err) {
      ErrorLogger.log("ShopCustomerController.create", err);
      return errorResponse(err, 500);
    }
  }

  async getBalance(req) {
    try {
      const searchParams =
        req?.nextUrl?.searchParams || new URL(req?.url || "").searchParams;
      const customer_id = searchParams.get("customer_id");
      if (!customer_id) {
        return errorResponse(new Error("customer_id is required"), 400);
      }
      const balance = await ShopCustomerRepository.getBalance(customer_id);
      return successResponse({ balance }, "Success");
    } catch (err) {
      ErrorLogger.log("ShopCustomerController.getBalance", err);
      return errorResponse(err, 500);
    }
  }
}

export default new ShopCustomerController();
