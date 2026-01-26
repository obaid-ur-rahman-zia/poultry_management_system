import UnitRepository from "@/app/repositories/unit/unitRepository";
import AccountSubHeadRepository from "@/app/repositories/account/accountSubHead/accountSubHeadRepository";
import AccountsRepository from "@/app/repositories/account/accounts/accountsRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";
import prisma from "@/lib/prisma";

class UnitController {
  async create(req) {
    try {
      const { req_object } = await req.json();
      const { prounit_nam, capacity, address } = req_object;

      if (!prounit_nam?.trim()) {
        const error = new Error("Unit Name is required");
        ErrorLogger.log(
          "Error creating unit in Method: UnitController.create",
          error
        );
        return errorResponse(error, 400);
      }

      // Check if unit already exists
      const duplicate = await UnitRepository.checkDuplicate(prounit_nam.trim());
      if (duplicate) {
        const error = new Error("Unit already exists");
        ErrorLogger.log(
          "Failed to create unit in Method: UnitController.create",
          error
        );
        return errorResponse(error, 400);
      }

      // Use transaction to ensure both unit and account are created together
      const result = await prisma.$transaction(
        async (tx) => {
          try {
            // Create unit
            const unit = await UnitRepository.create({
              prounit_nam: prounit_nam.trim(),
              capacity: capacity,
              address: address,
            }, tx);

            // Find or create "Unit" subhead
            let unitSubhead = await AccountSubHeadRepository.findByName("Unit", tx);
            
            if (!unitSubhead) {
              // Get first account head to use for the subhead
              const firstHead = await tx.account_head.findFirst({
                orderBy: { head_id: "asc" },
              });

              if (!firstHead) {
                throw new Error("No account head found. Please create an account head first.");
              }

              // Get the max subhead_id for this head_id
              const maxSubhead = await tx.account_sub_head.findFirst({
                where: { head_id: firstHead.head_id },
                orderBy: { subhead_id: "desc" },
                select: { subhead_id: true },
              });

              const nextSubheadId = maxSubhead ? maxSubhead.subhead_id + 1 : 1;

              // Create the Unit subhead
              unitSubhead = await tx.account_sub_head.create({
                data: {
                  head_id: firstHead.head_id,
                  subhead_id: nextSubheadId,
                  subhead_nam: "Unit",
                  is_parent: 0,
                  parent_sub_id: null,
                  insert_by: "system",
                  update_by: "system",
                  status: 1,
                },
              });
            }

            // Create account for the unit in the Unit subhead
            const maxAccount = await tx.accounts.findFirst({
              where: { sub_id: unitSubhead.sub_id },
              orderBy: { account_id: "desc" },
              select: { account_id: true },
            });

            const nextAccountId = maxAccount ? maxAccount.account_id + 1 : 1;

            await tx.accounts.create({
              data: {
                head_id: unitSubhead.head_id,
                sub_id: unitSubhead.sub_id,
                account_id: nextAccountId,
                account_nam: prounit_nam.trim(),
                insert_by: "system",
                update_by: "system",
                status: 1,
              },
            });

            return unit;
          } catch (transactionError) {
            ErrorLogger.log(
              "Transaction failed in UnitController.create",
              transactionError
            );
            throw transactionError;
          }
        },
        {
          maxWait: 10000,
          timeout: 30000,
          isolationLevel: "Serializable",
        }
      );

      await RedisService.del("units:all");
      await RedisService.del("accountSubHeads:all");
      await RedisService.del("accounts:all");
      return successResponse({ prounit_id: result.prounit_id }, "Unit and account created successfully");
    } catch (err) {
      if (err.code === "P2002") {
        ErrorLogger.log(
          "Unit already exists in Method: UnitController.create",
          err
        );
        return errorResponse(new Error("Unit already exists"), 400);
      }
      ErrorLogger.log(
        "Failed to create unit in Method: UnitController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readAll(req) {
    const cacheKey = "units:all";
    try {
      // Extract pagination params
      const searchParams = req?.nextUrl?.searchParams || new URL(req?.url || "").searchParams;
      const getAll = searchParams.get("all") === "true";
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "20");
      const skip = (page - 1) * limit;

      // If getAll is true, fetch all units without pagination
      let data, total;
      if (getAll) {
        data = await UnitRepository.readAll();
        total = data.length;
      } else {
        // Get total count and paginated units
        const result = await UnitRepository.readAllWithPagination(skip, limit);
        data = result.data;
        total = result.total;
      }

      // Use cache key with pagination to avoid cache conflicts
      const userCacheKey = getAll
        ? `${cacheKey}:all`
        : `${cacheKey}:page:${page}:limit:${limit}`;

      const cachedData = await RedisService.get(userCacheKey);
      if (cachedData) {
        console.log("Unit Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Unit Cache Miss");

      // If getAll, return all units without pagination structure
      if (getAll) {
        const response = { data };
        await RedisService.setex(userCacheKey, 300, JSON.stringify(response));
        return successResponse(response, "Success");
      }

      const paginatedResponse = {
        data,
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
        "Failed to fetch units in Method: UnitController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { prounit_id, prounit_nam, capacity, address } = req_object;
      if (!prounit_id || !prounit_nam) {
        const error = new Error(
          "prounit_id and prounit_nam are required in Method: UnitController.update"
        );
        ErrorLogger.log(
          "Failed to update unit in Method: UnitController.update",
          error
        );
        return errorResponse(error, 400);
      }

      const updated = await UnitRepository.update({
        ...req_object,
        capacity: capacity,
        address: address,
      });
      await RedisService.del("units:all");
      return successResponse(updated, "Unit updated successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to update unit in Method: UnitController.update",
          err
        );
        return errorResponse(new Error("Unit not found"), 404);
      }
      ErrorLogger.log(
        "Failed to update unit in Method: UnitController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new UnitController();
