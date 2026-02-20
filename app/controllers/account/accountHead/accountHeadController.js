import AccountHeadRepository from "@/app/repositories/account/accountHead/accountHeadRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";

class AccountHeadController {
  async readAll() {
    const cacheKey = "accountHeads:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Account Head Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Account Head Cache Miss");
      const data = await AccountHeadRepository.readAll();
      const nextId = await AccountHeadRepository.readNextId();
      await RedisService.setex(cacheKey, 300, JSON.stringify({ data, nextId }));
      return successResponse({ data, nextId }, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get all account heads in Method: AccountHeadController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async create(req) {
    try {
      const { req_object } = await req.json();
      const { head_nam } = req_object;
      if (!head_nam) {
        const error = new Error("Missing headName");
        ErrorLogger.log(
          "Failed to create account head in Method: AccountHeadController.create",
          error
        );
        return errorResponse(new Error("Missing headName"), 400);
      }

      const head = await AccountHeadRepository.create(head_nam.trim());
      await RedisService.del("accountHeads:all");
      return successResponse({ head_id: head.head_id }, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to create account head in Method: AccountHeadController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { head_id, new_head_nam } = req_object;
      if (!head_id || !new_head_nam) {
        const error = new Error("Head ID and new name are required");
        ErrorLogger.log(
          "Failed to update account head in Method: AccountHeadController.update",
          error
        );
        return errorResponse(error, 400);
      }

      const data = await AccountHeadRepository.update(
        head_id,
        new_head_nam.trim()
      );
      await RedisService.del("accountHeads:all");
      return successResponse(data, "Account head updated");
    } catch (err) {
      ErrorLogger.log(
        "Failed to update account head in Method: AccountHeadController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }

}

export default new AccountHeadController();
