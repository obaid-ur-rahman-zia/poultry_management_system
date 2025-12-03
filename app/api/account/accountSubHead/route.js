import AccountSubHeadController from "@/app/controllers/account/accountSubHead/accountSubHeadController";

export async function POST(req) {
  return AccountSubHeadController.create(req);
}

export async function PUT(req) {
  return AccountSubHeadController.update(req);
}
