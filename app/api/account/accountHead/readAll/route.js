import AccountHeadController from "@/app/controllers/account/accountHead/accountHeadController";

export async function GET() {
  return AccountHeadController.readAll();
}
