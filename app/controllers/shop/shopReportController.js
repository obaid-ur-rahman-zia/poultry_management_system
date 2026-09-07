import ShopReportRepository from "@/app/repositories/shop/shopReportRepository";
import { successResponse, errorResponse } from "@/app/utils/response";

export default class ShopReportController {
  static async getTrialBalance(req) {
    try {
      const { searchParams } = new URL(req.url);
      const shop_acc_id = searchParams.get("shop_acc_id");
      const end_dat = searchParams.get("end_dat");

      if (!shop_acc_id || !end_dat) {
        return errorResponse(new Error("shop_acc_id and end_dat are required"), 400);
      }

      const report = await ShopReportRepository.readTrialBalance({
        shop_acc_id,
        end_dat,
      });

      return successResponse(report, "Trial Balance retrieved successfully");
    } catch (err) {
      console.error("ShopReportController.getTrialBalance error:", err);
      return errorResponse(err, 500);
    }
  }

  static async getSaleDetail(req) {
    try {
      const { searchParams } = new URL(req.url);
      const shop_acc_id = searchParams.get("shop_acc_id");
      const start_dat = searchParams.get("start_dat");
      const end_dat = searchParams.get("end_dat");

      if (!shop_acc_id || !start_dat || !end_dat) {
        return errorResponse(
          new Error("shop_acc_id, start_dat, and end_dat are required"),
          400
        );
      }

      const report = await ShopReportRepository.readSaleDetail({
        shop_acc_id,
        start_dat,
        end_dat,
      });

      return successResponse(report, "Sale Detail Report retrieved successfully");
    } catch (err) {
      console.error("ShopReportController.getSaleDetail error:", err);
      return errorResponse(err, 500);
    }
  }
}
