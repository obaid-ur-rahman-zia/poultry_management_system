import AccountSubHeadRepository from "@/app/repositories/account/accountSubHead/accountSubHeadRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";

class AccountSubHeadController {
  async readAll() {
    const cacheKey = "accountSubHeads:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Account Subhead Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Account Subhead Cache Miss");
      const data = await AccountSubHeadRepository.readAll();
      await RedisService.setex(cacheKey, 300, JSON.stringify(data));
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get all account subheads in Method: AccountSubHeadController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readAccountsManage() {
    const cacheKey = "accountsManage:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Account Manage Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Account Manage Cache Miss");
      const data = await AccountSubHeadRepository.readAccountsManage();
      await RedisService.setex(cacheKey, 3000, JSON.stringify(data));
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get accounts manage in Method: AccountSubHeadController.readAccountsManage",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readByHead(req) {
    try {
      const { searchParams } = new URL(req.url);
      const head_id = searchParams.get("head_id");

      if (!head_id) {
        const error = new Error("Missing head_id");
        ErrorLogger.log(
          "Failed to get all account subheads in Method: AccountSubHeadController.readByHead",
          error
        );
        return errorResponse(error, 400);
      }

      const data = await AccountSubHeadRepository.readByHead(head_id);
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get all account subheads in Method: AccountSubHeadController.readByHead",
        err
      );
      return errorResponse(err, 500);
    }
  }

  // 🔎 Get one subhead by sub_id (primary key)
  async readById(req) {
    try {
      const { searchParams } = new URL(req.url);
      const sub_id = searchParams.get("sub_id");

      if (!sub_id) {
        const error = new Error("sub_id is required");
        ErrorLogger.log(
          "Failed to get account subhead by id in Method: AccountSubHeadController.readById",
          error
        );
        return errorResponse(error, 400);
      }

      const result = await AccountSubHeadRepository.readById(sub_id);
      if (!result) {
        ErrorLogger.log(
          "Failed to get account subhead by id in Method: AccountSubHeadController.readById",
          new Error("Subhead not found")
        );
        return errorResponse(new Error("Subhead not found"), 404);
      }

      return successResponse(result, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get account subhead by id in Method: AccountSubHeadController.readById",
        err
      );
      return errorResponse(err, 500);
    }
  }

  // ✍️ Create subhead
  async create(req) {
    try {
      const { req_object } = await req.json();
      const { head_id, subhead_nam, is_parent, parent_sub_id } = req_object;

      if (!head_id || !subhead_nam) {
        const error = new Error(
          "head_id and subhead_nam are required in Method: AccountSubHeadController.create"
        );
        return errorResponse(error, 400);
      }

      // Check for duplicate subhead name
      const duplicate = await AccountSubHeadRepository.checkDuplicate(subhead_nam.trim());
      if (duplicate) {
        const error = new Error(
          "A subhead with this name already exists"
        );
        ErrorLogger.log(
          "Failed to create subhead - duplicate name in Method: AccountSubHeadController.create",
          error
        );
        return errorResponse(error, 400);
      }

      // Use repository method with transaction
      const createdSubhead = await AccountSubHeadRepository.create({
        head_id,
        subhead_nam: subhead_nam.trim(),
        is_parent,
        parent_sub_id,
        insert_by: req_object.insert_by,
        update_by: req_object.update_by,
        status: req_object.status,
      });
      await RedisService.del("accountSubHeads:all");
      return successResponse(
        {
          sub_id: createdSubhead.sub_id,
          subhead_id: createdSubhead.subhead_id,
        },
        "Subhead created successfully"
      );
    } catch (err) {
      if (err.code === "P2002") {
        // unique constraint violation
        return errorResponse(
          new Error(
            "Subhead with this combination already exists in Method: AccountSubHeadController.create"
          ),
          400
        );
      }
      ErrorLogger.log(
        "Failed to create account subhead in Method: AccountSubHeadController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  // ✍️ Update subhead
  async update(req) {
    try {
      const { req_object } = await req.json();
      const { sub_id, subhead_nam } = req_object;

      if (!sub_id || !subhead_nam) {
        const error = new Error(
          "sub_id and subhead_nam are required in Method: AccountSubHeadController.update"
        );
        return errorResponse(error, 400);
      }

      // Check for duplicate subhead name, excluding current subhead
      const duplicate = await AccountSubHeadRepository.checkDuplicate(subhead_nam.trim(), sub_id);
      if (duplicate) {
        const error = new Error(
          "A subhead with this name already exists"
        );
        ErrorLogger.log(
          "Failed to update subhead - duplicate name in Method: AccountSubHeadController.update",
          error
        );
        return errorResponse(error, 400);
      }

      const updated = await AccountSubHeadRepository.update(sub_id, req_object);
      await RedisService.del("accountSubHeads:all");
      return successResponse(updated, "Subhead updated successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to update account subhead in Method: AccountSubHeadController.update",
          err
        );
        return errorResponse(new Error("Subhead not found"), 404);
      }
      ErrorLogger.log("Failed to update account subhead", err);
      return errorResponse(err, 500);
    }
  }

  // 🗑️ Delete subhead
  async delete(req) {
    try {
      const { searchParams } = new URL(req.url);
      const sub_id = searchParams.get("sub_id");

      if (!sub_id) {
        ErrorLogger.log(
          "Failed to delete account subhead in Method: AccountSubHeadController.delete",
          new Error("sub_id is required")
        );
        return errorResponse(new Error("sub_id is required"), 400);
      }

      await AccountSubHeadRepository.delete(sub_id);
      return successResponse({}, "Subhead deleted successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to delete account subhead in Method: AccountSubHeadController.delete",
          err
        );
        return errorResponse(new Error("Subhead not found"), 404);
      }
      ErrorLogger.log(
        "Failed to delete account subhead in Method: AccountSubHeadController.delete",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new AccountSubHeadController();
