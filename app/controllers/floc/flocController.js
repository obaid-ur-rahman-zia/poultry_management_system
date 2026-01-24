import FlocRepository from "@/app/repositories/floc/flocRepository";
import AccountSubHeadRepository from "@/app/repositories/account/accountSubHead/accountSubHeadRepository";
import AccountsRepository from "@/app/repositories/account/accounts/accountsRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";
import prisma from "@/lib/prisma";

class FlocController {
  async readAll(req) {
    const cacheKey = "flocs:all";
    try {
      // Extract pagination params
      const searchParams = req?.nextUrl?.searchParams || new URL(req?.url || "").searchParams;
      const getAll = searchParams.get("all") === "true";
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const skip = (page - 1) * limit;

      // If getAll is true, fetch all flocs without pagination
      let data, total;
      if (getAll) {
        data = await FlocRepository.readAll();
        total = data.length;
      } else {
        // Get total count and paginated flocs
        const result = await FlocRepository.readAllWithPagination(skip, limit);
        data = result.data;
        total = result.total;
      }

      // Use cache key with pagination to avoid cache conflicts
      const userCacheKey = getAll
        ? `${cacheKey}:all`
        : `${cacheKey}:page:${page}:limit:${limit}`;

      const cachedData = await RedisService.get(userCacheKey);
      if (cachedData) {
        console.log("Floc Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Floc Cache Miss");

      // If getAll, return all flocs without pagination structure
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
        "Failed to get all flocs in Method: FlocController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readById(req) {
    try {
      const { searchParams } = new URL(req.url);
      const floc_id = searchParams.get("floc_id");

      if (!floc_id) {
        const error = new Error("floc_id is required");
        ErrorLogger.log(
          "Failed to get floc by id in Method: FlocController.readById",
          error
        );
        return errorResponse(error, 400);
      }

      const result = await FlocRepository.readById(floc_id);
      if (!result) {
        ErrorLogger.log(
          "Failed to get floc by id in Method: FlocController.readById",
          new Error("Floc not found")
        );
        return errorResponse(new Error("Floc not found"), 404);
      }

      return successResponse(result, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get floc by id in Method: FlocController.readById",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readByFarmId(req) {
    try {
      const { searchParams } = new URL(req.url);
      const farm_id = searchParams.get("farm_id");

      if (!farm_id) {
        const error = new Error("farm_id is required");
        ErrorLogger.log(
          "Failed to get flocs by farm id in Method: FlocController.readByFarmId",
          error
        );
        return errorResponse(error, 400);
      }

      const data = await FlocRepository.readByFarmId(farm_id);
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get flocs by farm id in Method: FlocController.readByFarmId",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async create(req) {
    try {
      const { req_object } = await req.json();
      // Support both prounit_id and farm_id for backward compatibility
      const prounit_id = req_object.prounit_id || req_object.farm_id;
      const { starting_date, stackholders } = req_object;

      if (!prounit_id || !starting_date || !stackholders || !Array.isArray(stackholders)) {
        const error = new Error(
          "prounit_id (or farm_id), starting_date, and stackholders are required in Method: FlocController.create"
        );
        ErrorLogger.log(
          "Failed to create floc in Method: FlocController.create",
          error
        );
        return errorResponse(error, 400);
      }

      // Validate stackholders percentage totals 100%
      const totalPercentage = stackholders.reduce(
        (sum, sh) => sum + (parseFloat(sh.percentage) || 0),
        0
      );
      if (Math.abs(totalPercentage - 100) > 0.01) {
        const error = new Error("Stackholders percentage must total exactly 100%");
        ErrorLogger.log(
          "Failed to create floc in Method: FlocController.create",
          error
        );
        return errorResponse(error, 400);
      }

      // Check if unit already has an active floc
      const activeFloc = await FlocRepository.findActiveFlocByFarmId(prounit_id);
      if (activeFloc) {
        const error = new Error(
          "Unit already has an active floc. Please end the current floc first."
        );
        ErrorLogger.log(
          "Failed to create floc in Method: FlocController.create",
          error
        );
        return errorResponse(error, 400);
      }

      // Ensure prounit_id is set in req_object
      req_object.prounit_id = prounit_id;

      // Validate dates
      if (req_object.ending_date) {
        const startDate = new Date(starting_date);
        const endDate = new Date(req_object.ending_date);
        if (startDate > endDate) {
          const error = new Error("Ending date must be after starting date");
          ErrorLogger.log(
            "Failed to create floc in Method: FlocController.create",
            error
          );
          return errorResponse(error, 400);
        }
      }

      // Get unit information for account name
      const unit = await prisma.pro_unit.findUnique({
        where: { prounit_id: Number(prounit_id) },
      });

      if (!unit) {
        const error = new Error("Unit not found");
        ErrorLogger.log(
          "Failed to create floc in Method: FlocController.create",
          error
        );
        return errorResponse(error, 404);
      }

      // Use transaction to ensure both floc and account are created together
      const result = await prisma.$transaction(
        async (tx) => {
          try {
            // Create floc
            const floc = await FlocRepository.create(req_object, tx);

            // Create stackholders in junction table
            if (stackholders && Array.isArray(stackholders) && stackholders.length > 0) {
              for (const sh of stackholders) {
                await tx.floc_stackholder.create({
                  data: {
                    floc_id: floc.floc_id,
                    stackholder_id: Number(sh.stackholder_id),
                    percentage: parseFloat(sh.percentage),
                    insert_by: req_object.insert_by || "user 1",
                    update_by: req_object.update_by || "user 1",
                    status: 1,
                  },
                });
              }
            }

            // Find or create "Floc" subhead
            let flocSubhead = await AccountSubHeadRepository.findByName("Floc", tx);
            
            if (!flocSubhead) {
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

              // Create the Floc subhead
              flocSubhead = await tx.account_sub_head.create({
                data: {
                  head_id: firstHead.head_id,
                  subhead_id: nextSubheadId,
                  subhead_nam: "Floc",
                  is_parent: 0,
                  parent_sub_id: null,
                  insert_by: "system",
                  update_by: "system",
                  status: 1,
                },
              });
            }

            // Create account name for the floc (e.g., "UnitName - Floc #1")
            const flocAccountName = `${unit.prounit_nam} - Floc #${floc.floc_id}`;

            // Create account for the floc in the Floc subhead
            const maxAccount = await tx.accounts.findFirst({
              where: { sub_id: flocSubhead.sub_id },
              orderBy: { account_id: "desc" },
              select: { account_id: true },
            });

            const nextAccountId = maxAccount ? maxAccount.account_id + 1 : 1;

            await tx.accounts.create({
              data: {
                head_id: flocSubhead.head_id,
                sub_id: flocSubhead.sub_id,
                account_id: nextAccountId,
                account_nam: flocAccountName,
                insert_by: "system",
                update_by: "system",
                status: 1,
              },
            });

            // Fetch floc with stackholders
            return await tx.floc.findUnique({
              where: { floc_id: floc.floc_id },
              include: {
                unit: true,
                floc_stackholders: {
                  include: {
                    stackholder: true,
                  },
                },
              },
            });
          } catch (transactionError) {
            ErrorLogger.log(
              "Transaction failed in FlocController.create",
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

      await RedisService.del("flocs:all");
      await RedisService.del("accountSubHeads:all");
      await RedisService.del("accounts:all");
      return successResponse(
        { floc_id: result.floc_id },
        "Floc and account created successfully"
      );
    } catch (err) {
      ErrorLogger.log(
        "Failed to create floc in Method: FlocController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { floc_id } = req_object;

      if (!floc_id) {
        const error = new Error(
          "floc_id is required in Method: FlocController.update"
        );
        ErrorLogger.log(
          "Failed to update floc in Method: FlocController.update",
          error
        );
        return errorResponse(error, 400);
      }

      // If updating stackholders, validate percentage
      if (req_object.stackholders && Array.isArray(req_object.stackholders)) {
        const totalPercentage = req_object.stackholders.reduce(
          (sum, sh) => sum + (parseFloat(sh.percentage) || 0),
          0
        );
        if (Math.abs(totalPercentage - 100) > 0.01) {
          const error = new Error("Stackholders percentage must total exactly 100%");
          ErrorLogger.log(
            "Failed to update floc in Method: FlocController.update",
            error
          );
          return errorResponse(error, 400);
        }
      }

      // If updating prounit_id or farm_id, check if new unit has active floc
      const prounit_id = req_object.prounit_id || req_object.farm_id;
      if (prounit_id) {
        const currentFloc = await FlocRepository.readById(floc_id);
        const currentProunitId = currentFloc?.prounit_id || currentFloc?.farm_id;
        if (currentFloc && currentProunitId !== prounit_id) {
          const activeFloc = await FlocRepository.findActiveFlocByFarmId(prounit_id);
          if (activeFloc && activeFloc.floc_id !== Number(floc_id)) {
            const error = new Error(
              "Unit already has an active floc. Please end the current floc first."
            );
            ErrorLogger.log(
              "Failed to update floc in Method: FlocController.update",
              error
            );
            return errorResponse(error, 400);
          }
        }
        // Ensure prounit_id is set in req_object
        req_object.prounit_id = prounit_id;
      }

      // Use transaction to update floc and stackholders
      const result = await prisma.$transaction(
        async (tx) => {
          // Update floc (excluding stackholders - handled separately)
          const updateData = { ...req_object };
          delete updateData.stackholders; // Remove stackholders from update data
          
          const updatedFloc = await FlocRepository.update(floc_id, updateData);

          // Update stackholders if provided
          if (req_object.stackholders && Array.isArray(req_object.stackholders)) {
            // Delete existing stackholders for this floc
            await tx.floc_stackholder.deleteMany({
              where: {
                floc_id: Number(floc_id),
              },
            });

            // Create new stackholders
            for (const sh of req_object.stackholders) {
              await tx.floc_stackholder.create({
                data: {
                  floc_id: Number(floc_id),
                  stackholder_id: Number(sh.stackholder_id),
                  percentage: parseFloat(sh.percentage),
                  insert_by: req_object.update_by || "user 1",
                  update_by: req_object.update_by || "user 1",
                  status: 1,
                },
              });
            }
          }

          // Fetch updated floc with stackholders
          return await tx.floc.findUnique({
            where: { floc_id: Number(floc_id) },
            include: {
              unit: true,
              floc_stackholders: {
                include: {
                  stackholder: true,
                },
              },
            },
          });
        },
        {
          maxWait: 10000,
          timeout: 30000,
        }
      );

      await RedisService.del("flocs:all");
      return successResponse(result, "Floc updated successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to update floc in Method: FlocController.update",
          err
        );
        return errorResponse(new Error("Floc not found"), 404);
      }
      ErrorLogger.log(
        "Failed to update floc in Method: FlocController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async clearEndingDate(req) {
    try {
      const { req_object } = await req.json();
      const { floc_id, clear_description } = req_object;

      if (!floc_id || !clear_description?.trim()) {
        const error = new Error(
          "floc_id and clear_description are required in Method: FlocController.clearEndingDate"
        );
        ErrorLogger.log(
          "Failed to clear ending date in Method: FlocController.clearEndingDate",
          error
        );
        return errorResponse(error, 400);
      }

      const updated = await FlocRepository.clearEndingDate(floc_id, clear_description);
      await RedisService.del("flocs:all");
      return successResponse(updated, "Ending date cleared successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to clear ending date in Method: FlocController.clearEndingDate",
          err
        );
        return errorResponse(new Error("Floc not found"), 404);
      }
      ErrorLogger.log(
        "Failed to clear ending date in Method: FlocController.clearEndingDate",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async delete(req) {
    try {
      const { searchParams } = new URL(req.url);
      const floc_id = searchParams.get("floc_id");

      if (!floc_id) {
        ErrorLogger.log(
          "Failed to delete floc in Method: FlocController.delete",
          new Error("floc_id is required")
        );
        return errorResponse(new Error("floc_id is required"), 400);
      }

      await FlocRepository.delete(floc_id);
      await RedisService.del("flocs:all");
      return successResponse({}, "Floc deleted successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to delete floc in Method: FlocController.delete",
          err
        );
        return errorResponse(new Error("Floc not found"), 404);
      }
      ErrorLogger.log(
        "Failed to delete floc in Method: FlocController.delete",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new FlocController();

