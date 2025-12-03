import AccountSubHeadController from "@/app/controllers/account/accountSubHead/accountSubHeadController";

export async function GET(req) {
  return AccountSubHeadController.readById(req);
}
