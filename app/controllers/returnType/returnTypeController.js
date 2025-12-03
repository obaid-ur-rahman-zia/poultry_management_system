import ReturnTypeRepository from "@/app/repositories/returnType/returnTypeRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";

class ReturnTypeController {
  async readAll() {
    const cacheKey = "returnTypes:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Return Type Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Return Type Cache Miss");
      const data = await ReturnTypeRepository.readAll();
      await RedisService.setex(cacheKey, 300, JSON.stringify(data));
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to fetch return types in Method: ReturnTypeController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new ReturnTypeController();
