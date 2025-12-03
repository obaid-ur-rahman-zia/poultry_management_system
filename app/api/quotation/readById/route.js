import QuotationController from "@/app/controllers/quotation/quotationController";

export async function GET(req) {
  return QuotationController.readById(req);
}
