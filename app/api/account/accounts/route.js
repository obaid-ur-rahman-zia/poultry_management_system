import AccountsController from "@/app/controllers/account/accounts/accountsController";

export async function POST(req) {
  return AccountsController.create(req);
}

export async function PUT(req) {
  return AccountsController.update(req);
}

export async function DELETE(req) {
  return AccountsController.delete(req);
}