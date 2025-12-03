import SaleReturnRepository from "@/app/repositories/saleReturn/saleReturnRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import errorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";

class SaleReturnController {
  async readAll() {
    const cacheKey = "saleReturns:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Sale Return Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Sale Return Cache Miss");
      const return_data = await SaleReturnRepository.readAll();
      const nextId = await SaleReturnRepository.readNextId();
      await RedisService.setex(
        cacheKey,
        300,
        JSON.stringify({ return_data, nextId })
      );
      return successResponse({ return_data, nextId }, "Success");
    } catch (err) {
      errorLogger.log(
        "Failed to fetch sale returns in Method: SaleReturnController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new SaleReturnController();
