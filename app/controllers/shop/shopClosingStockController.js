import ShopClosingStockRepository from "@/app/repositories/shop/shopClosingStockRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import prisma from "@/lib/prisma";

class ShopClosingStockController {
  /**
   * GET /api/shop/closing-stock?shop_acc_id=X
   * Returns list of closing stock records (for list view)
   */
  async readAll(req) {
    try {
      const searchParams =
        req?.nextUrl?.searchParams || new URL(req?.url || "").searchParams;
      const shop_acc_id = searchParams.get("shop_acc_id");
      const data = await ShopClosingStockRepository.readAll(shop_acc_id);
      return successResponse({ data }, "Success");
    } catch (err) {
      ErrorLogger.log("ShopClosingStockController.readAll", err);
      return errorResponse(err, 500);
    }
  }

  /**
   * GET /api/shop/stock?shop_acc_id=X&date=YYYY-MM-DD
   * Returns stock summary: today_purchase (from local_sale), previous_stock (from closing_stock), total_stock
   */
  async getStock(req) {
    try {
      const searchParams =
        req?.nextUrl?.searchParams || new URL(req?.url || "").searchParams;
      const shop_acc_id = searchParams.get("shop_acc_id");
      const date = searchParams.get("date");

      if (!shop_acc_id || !date) {
        return errorResponse(new Error("shop_acc_id and date are required"), 400);
      }

      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      // Today's purchase stock = sum of purchaser_weight from local_sale
      // where purchaser_account = shop_acc_id (the shop is on the purchaser side)
      const todayAgg = await prisma.local_sale.aggregate({
        where: {
          purchaser_account: Number(shop_acc_id),
          local_sale_date: { gte: start, lte: end },
          status: 1,
        },
        _sum: { purchaser_weight: true },
      });
      const today_purchase = todayAgg._sum.purchaser_weight || 0;

      // Previous stock = closing_weight from the most recent shop_closing_stock before today
      const prevClosing = await ShopClosingStockRepository.getPreviousStock(shop_acc_id, date);
      const previous_stock = prevClosing?.closing_weight || 0;

      const total_stock = previous_stock + today_purchase;

      // Today's closing stock entry (if any already saved)
      const today_closing = await ShopClosingStockRepository.readByDateAndShop(shop_acc_id, date);

      return successResponse(
        { today_purchase, previous_stock, total_stock, today_closing: today_closing || null },
        "Success"
      );
    } catch (err) {
      ErrorLogger.log("ShopClosingStockController.getStock", err);
      return errorResponse(err, 500);
    }
  }

  /**
   * POST /api/shop/closing-stock
   * Upsert: create or update closing stock for a given shop+date
   */
  async upsert(req) {
    try {
      const { req_object } = await req.json();
      const { shop_acc_id, closing_date, closing_weight } = req_object;

      if (!shop_acc_id || !closing_date || closing_weight === undefined || closing_weight === null) {
        return errorResponse(
          new Error("shop_acc_id, closing_date, and closing_weight are required"),
          400
        );
      }

      if (Number(closing_weight) < 0) {
        return errorResponse(new Error("closing_weight must be non-negative"), 400);
      }

      const data = await ShopClosingStockRepository.upsert(req_object);
      return successResponse(data, "Closing stock saved successfully");
    } catch (err) {
      ErrorLogger.log("ShopClosingStockController.upsert", err);
      return errorResponse(err, 500);
    }
  }
}

export default new ShopClosingStockController();
