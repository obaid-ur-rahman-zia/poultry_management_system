import QuotationController from "@/app/controllers/quotation/quotationController";

export async function GET() {
  return QuotationController.readAll();
}
