import AccountHeadController from "@/app/controllers/account/accountHead/accountHeadController";

export async function POST(req) {
  return AccountHeadController.create(req);
}

export async function PUT(req) {
  return AccountHeadController.update(req);
}
