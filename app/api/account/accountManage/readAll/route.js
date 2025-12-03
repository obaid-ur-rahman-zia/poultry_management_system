import AccountSubHeadController from "@/app/controllers/account/accountSubHead/accountSubHeadController";

export async function GET() {
  return AccountSubHeadController.readAccountsManage();
}
