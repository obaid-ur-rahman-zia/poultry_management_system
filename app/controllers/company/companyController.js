import CompanyRepository from "@/app/repositories/company/companyRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";

class CompanyController {
  async create(req) {
    try {
      const { req_object } = await req.json();
      const { company_nam } = req_object;

      if (!company_nam?.trim()) {
        const error = new Error("Company Name is required");
        ErrorLogger.log(
          "Error creating companies in Method: CompanyController.create",
          error
        );
        return errorResponse(error, 400);
      }

      // Check if company already exists
      const duplicate = await CompanyRepository.checkDuplicate(
        company_nam.trim()
      );
      if (duplicate) {
        const error = new Error("Company already exists");
        ErrorLogger.log(
          "Failed to create company in Method: CompanyController.create",
          error
        );
        return errorResponse(error, 400);
      }
      const company = await CompanyRepository.create(company_nam.trim());
      await RedisService.del("companies:all");
      return successResponse({ company_id: company.company_id }, "Success");
    } catch (err) {
      if (err.code === "P2002") {
        ErrorLogger.log(
          "Company already exits in Method: CompanyController.create",
          err
        );
        return errorResponse(new Error("Company already exists"), 400);
      }
      ErrorLogger.log(
        "Failt to create company in Method: CompanyController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readAll() {
    const cacheKey = "companies:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Company Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Company Cache Miss");
      const data = await CompanyRepository.readAll();
      await RedisService.setex(cacheKey, 300, JSON.stringify(data));
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to fetch companies in Method: CompanyController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { company_id, company_nam } = req_object;
      if (!company_id || !company_nam) {
        const error = new Error(
          "company_id and company_nam are required in Method: CompanyController.update"
        );
        ErrorLogger.log(
          "Failed to update unit in Method: CompanyController.update",
          error
        );
        return errorResponse(error, 400);
      }

      const updated = await CompanyRepository.update(req_object);
      await RedisService.del("companies:all");
      return successResponse(updated, "Company updated successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to update unit in Method: CompanyController.update",
          err
        );
        return errorResponse(new Error("Company not found"), 404);
      }
      ErrorLogger.log(
        "Failed to update unit in Method: CompanyController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new CompanyController();
