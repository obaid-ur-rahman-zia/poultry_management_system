import { NextResponse } from "next/server";
import ShopReportController from "@/app/controllers/shop/shopReportController";

export async function GET(req) {
  return await ShopReportController.getCustomerLedger(req);
}
