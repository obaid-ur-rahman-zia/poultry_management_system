import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import VoucherRepository from "@/app/repositories/voucher/voucherRepository";
import transactionRepository from "@/app/repositories/transaction/transactionRepository";
import RedisService from "@/app/utils/redis";
import prisma from "@/lib/prisma";

class VoucherController {
  async readByAccountId(req) {
    try {
      const { searchParams } = new URL(req.url);
      const acc_id = searchParams.get("acc_id");
      if (!acc_id) {
        throw new Error("Account ID is required");
      }

      const vouchers = await VoucherRepository.readByAccountId(acc_id);

      return successResponse({ vouchers }, "Success");
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      ErrorLogger.log(
        "Failed to get vochers in Method: VoucherController.readByAccountId",
        err
      );
      return errorResponse(error, 500);
    }
  }

  async getByVoucherId(voucher_id, financial_year) {
    try {
      if (!voucher_id) {
        throw new Error("Voucher ID is required");
      }

      if (!financial_year) {
        throw new Error("Voucher ID is required");
      }

      const vouchers = await VoucherRepository.readByVoucherId(
        voucher_id,
        financial_year
      );

      return successResponse({ vouchers }, "Success");
    } catch (error) {
      console.error("Error fetching voucher:", error);
      ErrorLogger.log(
        "Failed to get voucher in Method: VoucherController.getByVoucherId",
        error
      );
      return errorResponse(error, 500);
    }
  }

  async readAll() {
    const cacheKey = "vouchers:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Voucher Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Voucher Cache Miss");
      const data = await VoucherRepository.readAll();
      const nextId = await VoucherRepository.readNextId();
      await RedisService.setex(cacheKey, 300, JSON.stringify({ data, nextId }));
      return successResponse({ data, nextId }, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get vouchers in Method: VoucherController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async getNextVoucherId(financial_year) {
    const data = await VoucherRepository.getNextVoucherId(financial_year);

    return successResponse({ data }, "Success");
  }

  async create(req) {
    try {
      const { req_object } = await req.json();

      const required = [
        "acc_id",
        "financial_year",
        "voucher_type",
        "voucher_id",
        "record_no",
      ];

      for (const field of required) {
        if (req_object[field] === undefined || req_object[field] === null) {
          const error = new Error(`${field} is required`);
          ErrorLogger.log(
            "Failed to create voucher in Method: VoucherController.create",
            error
          );
          return errorResponse(error, 400);
        }
      }

      const data = req_object;

      console.log("This is data: ", data);

      const account = await prisma.accounts.findUnique({
        where: { acc_id: data.acc_id },
      });
      console.log("Account found:", account);

      const voucherData = {
        ...data,
        // voucher_id: data.voucher_id,
        // record_no: data.record_no,
      };

      const voucher = await VoucherRepository.create(voucherData);

      await transactionRepository.create({
        ...voucherData,
        reference_id: voucher.voucher_id,
        reference: "Voucher",
      });
      await RedisService.del("vouchers:all");
      await RedisService.del("transactions:all");
      return successResponse({ voucher }, "Voucher created successfully");
    } catch (err) {
      if (err.code === "P2002") {
        ErrorLogger.log(
          "Voucher already exists in Method: VoucherController.create",
          err
        );
        return errorResponse(new Error("Voucher already exists"), 400);
      }
      ErrorLogger.log(
        "Failed to create voucher in Method: VoucherController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();

      if (!req_object.v_id) {
        const error = new Error("v_id is required for update");
        ErrorLogger.log(
          "Failed to update voucher in Method: VoucherController.update",
          error
        );
        return errorResponse(error, 400);
      }

      const data = await VoucherRepository.update(req_object.v_id, req_object);

      // Update corresponding transaction
      await transactionRepository.updateByReferenceId(
        req_object.voucher_id,
        req_object.record_no,
        {
          acc_id: req_object.acc_id,
          financial_year: req_object.financial_year,
          voucher_type: req_object.voucher_type,
          debit: req_object.debit,
          credit: req_object.credit,
          remarks: req_object.remarks,
          manual_voucher_no: req_object.manual_voucher_no,
          isDeleted: req_object.isDeleted,
          isEdited: req_object.isEdited,
        }
      );
      await RedisService.del("vouchers:all");
      await RedisService.del("transactions:all");
      return successResponse(data, "Voucher updated successfully");
    } catch (err) {
      if (err.code === "P2002") {
        ErrorLogger.log(
          "Voucher conflict in Method: VoucherController.update",
          err
        );
        return errorResponse(new Error("Voucher update conflict"), 400);
      }
      ErrorLogger.log(
        "Failed to update voucher in Method: VoucherController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async delete(req) {
    try {
      const { req_object } = await req.json();

      if (!req_object.voucher_id) {
        const error = new Error("voucher_id is required for deletion");
        ErrorLogger.log(
          "Failed to delete voucher in Method: VoucherController.delete",
          error
        );
        return errorResponse(error, 400);
      }

      // Soft delete the voucher
      const data = await VoucherRepository.softDelete(req_object.voucher_id);

      // Soft delete corresponding transactions
      await transactionRepository.softDeleteByReferenceId(
        req_object.voucher_id,
        "Voucher"
      );

      return successResponse(data, "Voucher deleted successfully");
    } catch (err) {
      ErrorLogger.log(
        "Failed to delete voucher in Method: VoucherController.delete",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new VoucherController();

// import { successResponse, errorResponse } from "@/app/utils/response";
// import ErrorLogger from "@/app/utils/errorLogger";
// import VoucherRepository from "@/app/repositories/voucher/voucherRepository";
// import { voucher_type } from "@/lib/generated/prisma";
// import transactionRepository from "@/app/repositories/transaction/transactionRepository";

// class VoucherController {
//   async getByAccountId(acc_id) {
//     try {
//       if (!acc_id) {
//         throw new Error("Account ID is required");
//       }

//       const vouchers = await VoucherRepository.readByAccountId(acc_id);

//       return successResponse({ vouchers }, "Success");
//     } catch (error) {
//       console.error("Error fetching vouchers:", error);
//       ErrorLogger.log(
//         "Failed to get vochers in Method: VoucherController.getByAccountId",
//         err
//       );
//       return errorResponse(err, 500);
//     }
//   }

//   async readAll() {
//     try {
//       const data = await VoucherRepository.readAll();
//       const nextId = await VoucherRepository.readNextId();
//       return successResponse({ data, nextId }, "Success");
//     } catch (err) {
//       ErrorLogger.log(
//         "Failed to get vochers in Method: VoucherController.readAll",
//         err
//       );
//       return errorResponse(err, 500);
//     }
//   }

//   async getNextVoucherId(financial_year) {
//     const data = await VoucherRepository.getNextVoucherId(financial_year);

//     return successResponse({ data }, "Success");
//   }

//   async create(req) {
//     try {
//       const { req_object } = await req.json();

//       const required = ["acc_id", "financial_year", "voucher_type"];

//       for (const field of required) {
//         if (!req_object[field]) {
//           const error = new Error(`${field} is required`);
//           ErrorLogger.log(
//             "Failed to create voucher in Method: VoucherController.create",
//             error
//           );
//           return errorResponse(error, 400);
//         }
//       }

//       const data = req_object;

//       // const voucherType = req_object.voucher_type;
//       // console.log(data);

//       // if (voucherType === "CR" || voucherType === "BR") {
//       //   const voucher = await VoucherRepository.createDebitVoucher(data);
//       //   return successResponse({ voucher }, "Success");
//       // } else if (
//       //   voucherType === "CP" ||
//       //   voucherType === "BP"
//       // ) {
//       //   const voucher = await VoucherRepository.createCreditVoucher(data);
//       //   return successResponse({ voucher }, "Success");
//       // }

//       // const voucherId = await VoucherRepository.getNextVoucherId(data.financial_year);

//       const voucherData = {
//         ...data,
//         voucher_id: data.voucher_id,
//       };

//       const voucher = await VoucherRepository.create(voucherData);

//       await transactionRepository.create({
//         ...voucherData,
//         reference_id: voucher.voucher_id,
//         reference: "Voucher",
//       });

//       return successResponse({ voucher }, "Success");
//     } catch (err) {
//       if (err.code === "P2002") {
//         ErrorLogger.log(
//           "voucher already exists in Method: VoucherController.create",
//           err
//         );
//         return errorResponse(new Error("Voucher already exists"), 400);
//       }
//       ErrorLogger.log(
//         "Failed to create voucher in Method: VoucherController.create",
//         err
//       );
//       return errorResponse(err, 500);
//     }
//   }

//   //   async update(req) {
//   //     try {
//   //       const { req_object } = await req.json();
//   //       const { area_id, new_area_nam } = req_object;
//   //       if (!area_id || !new_area_nam) {
//   //         const error = new Error("Area ID and new name are required");
//   //         ErrorLogger.log(
//   //           "Failed to update area in Method: VoucherController.update",
//   //           error
//   //         );
//   //         return errorResponse(error, 400);
//   //       }

//   //       const data = await AreaRepository.update(area_id, new_area_nam.trim());
//   //       return successResponse(data, "Area updated");
//   //     } catch (err) {
//   //       if (err.code === "P2002") {
//   //         ErrorLogger.log(
//   //           "Area already exists in Method: VoucherController.update",
//   //           err
//   //         );
//   //         return errorResponse(new Error("Area already exists"), 400);
//   //       }
//   //       ErrorLogger.log(
//   //         "Failed to update area in Method: VoucherController.update",
//   //         err
//   //       );
//   //       return errorResponse(err, 500);
//   //     }
//   //   }
// }

// export default new VoucherController();
