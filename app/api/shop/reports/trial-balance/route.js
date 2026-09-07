import { NextResponse } from "next/server";
import ShopReportController from "../../../../../controllers/shop/shopReportController";

export async function GET(req) {
  return await ShopReportController.getTrialBalance(req);
}
