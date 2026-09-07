import ShopSaleRepository from "@/app/repositories/shop/shopSaleRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";

class ShopSaleController {
  async readAll(req) {
    try {
      const searchParams =
        req?.nextUrl?.searchParams || new URL(req?.url || "").searchParams;
      const shop_acc_id = searchParams.get("shop_acc_id");
      const date = searchParams.get("date");
      const data = await ShopSaleRepository.readAll(shop_acc_id, date);
      return successResponse({ data }, "Success");
    } catch (err) {
      ErrorLogger.log("ShopSaleController.readAll", err);
      return errorResponse(err, 500);
    }
  }

  async create(req) {
    try {
      const { req_object } = await req.json();
      const { sale_date, shop_acc_id, customer_id, qty, rate } = req_object;

      if (!sale_date || !shop_acc_id || !customer_id || qty === undefined || rate === undefined) {
        return errorResponse(
          new Error("sale_date, shop_acc_id, customer_id, qty, and rate are required"),
          400
        );
      }

      // Compute amount server-side for integrity
      req_object.amount = Number(qty) * Number(rate);
      const previous_balance = Number(req_object.previous_balance || 0);
      const received_amount = Number(req_object.received_amount || 0);
      req_object.net_balance = previous_balance + req_object.amount - received_amount;

      const data = await ShopSaleRepository.create(req_object);
      return successResponse(data, "Shop sale created successfully", 201);
    } catch (err) {
      ErrorLogger.log("ShopSaleController.create", err);
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { shop_sale_id } = req_object;
      if (!shop_sale_id) {
        return errorResponse(new Error("shop_sale_id is required"), 400);
      }

      const existing = await ShopSaleRepository.readById(shop_sale_id);
      if (!existing || existing.status === 0) {
        return errorResponse(new Error("Shop sale not found"), 404);
      }

      // Recompute amount if qty/rate changed
      if (req_object.qty !== undefined && req_object.rate !== undefined) {
        req_object.amount = Number(req_object.qty) * Number(req_object.rate);
        const prev = Number(req_object.previous_balance ?? existing.previous_balance ?? 0);
        const recv = Number(req_object.received_amount ?? existing.received_amount ?? 0);
        req_object.net_balance = prev + req_object.amount - recv;
      }

      const data = await ShopSaleRepository.update(shop_sale_id, req_object);
      return successResponse(data, "Shop sale updated successfully");
    } catch (err) {
      ErrorLogger.log("ShopSaleController.update", err);
      return errorResponse(err, 500);
    }
  }

  async delete(req) {
    try {
      const searchParams =
        req?.nextUrl?.searchParams || new URL(req?.url || "").searchParams;
      const shop_sale_id = searchParams.get("shop_sale_id");
      if (!shop_sale_id) {
        return errorResponse(new Error("shop_sale_id is required"), 400);
      }

      const existing = await ShopSaleRepository.readById(shop_sale_id);
      if (!existing || existing.status === 0) {
        return errorResponse(new Error("Shop sale not found"), 404);
      }

      await ShopSaleRepository.delete(shop_sale_id);
      return successResponse(null, "Shop sale deleted successfully");
    } catch (err) {
      ErrorLogger.log("ShopSaleController.delete", err);
      return errorResponse(err, 500);
    }
  }
}

export default new ShopSaleController();
