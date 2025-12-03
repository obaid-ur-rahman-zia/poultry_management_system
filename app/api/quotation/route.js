import QuotationController from "@/app/controllers/quotation/quotationController";

export async function POST(req) {
  return QuotationController.create(req);
}

export async function PUT(req) {
  return QuotationController.update(req);
}
