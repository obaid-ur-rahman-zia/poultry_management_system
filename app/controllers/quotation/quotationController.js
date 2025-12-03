import QuotationRepository from "@/app/repositories/quotation/quotationRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import errorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";

class QuotationController {
  async readAll() {
    const cacheKey = "quotations:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Quotation Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Quotation Cache Miss");
      const quotation_data = await QuotationRepository.readAll();
      const nextId = await QuotationRepository.readNextId();
      await RedisService.setex(
        cacheKey,
        300,
        JSON.stringify({ quotation_data, nextId })
      );
      return successResponse({ quotation_data, nextId }, "Success");
    } catch (err) {
      errorLogger.log(
        "Failed to fetch quotations in Method: QuotationController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readById(req) {
    try {
      const { searchParams } = new URL(req.url);
      const quotation_id = searchParams.get("quotation_id");
      if (!quotation_id) {
        const error = new Error("Quotation ID is required");
        errorLogger.log(
          "Failed to get quotation by id in Method: QuotationController.readById",
          error
        );
        return errorResponse(error, 400);
      }
      const result = await QuotationRepository.readById(quotation_id);
      if (!result) {
        const error = new Error("Quotation not found");
        errorLogger.log(
          "Failed to get quotation by id in Method: QuotationController.readById",
          error
        );
        return errorResponse(error, 404);
      }
      return successResponse(result, "Success");
    } catch (err) {
      errorLogger.log(
        "Failed to get quotation by id in Method: QuotationController.readById",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async create(req) {
    try {
      const { req_object } = await req.json();
      if (!req_object.items || req_object.items.length === 0) {
        errorLogger.log("Cart cannot be empty in QuotationController.create");
        return errorResponse(
          "Cart cannot be empty in QuotationController.create",
          400
        );
      }
      const { salesman_id, customer_id, total_amount } = req_object;

      if (!salesman_id || !customer_id || !total_amount) {
        errorLogger.log(
          "Missing required fields in QuotationController.create"
        );
        return errorResponse(
          "Missing required fields in QuotationController.create",
          400
        );
      }

      const quotation = await QuotationRepository.create(req_object);
      await RedisService.del("quotations:all");
      return successResponse(
        { quotation_id: quotation.quotation_id },
        "Quotation created successfully"
      );
    } catch (err) {
      if (err.code === "P2002") {
        errorLogger.log("Duplication Occured in Quotation Controller.create");
        return errorResponse(
          "Duplication Occured in Quotation Controller.create",
          400
        );
      }
      errorLogger.log(
        "Failed to create quotation in Method: QuotationController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { quotation_id } = req_object;

      // Validation
      if (!quotation_id) {
        const error = new Error("quotation_id is required");
        errorLogger.log(
          "Failed to update quotation in Method: QuotationController.update",
          error
        );
        return errorResponse(error, 400);
      }

      if (!req_object.items || req_object.items.length === 0) {
        const error = new Error("Cart can't be empty");
        errorLogger.log(
          "Failed to update quotation in Method: QuotationController.update",
          error
        );
        return errorResponse(error, 400);
      }

      const updatedQuotation = await QuotationRepository.update(req_object);

      return successResponse(
        { QuotationID: updatedQuotation.quotation_id },
        "Quotation updated successfully"
      );
    } catch (err) {
      errorLogger.log(
        "Failed to update quotation in Method: QuotationController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new QuotationController();
