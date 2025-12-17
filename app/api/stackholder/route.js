import StackholderController from "@/app/controllers/stackholder/stackholderController";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const stackholder_id = searchParams.get("stackholder_id");

  if (stackholder_id) {
    return await StackholderController.readById(req);
  }

  return await StackholderController.readAll();
}

export async function POST(req) {
  return await StackholderController.create(req);
}

export async function PUT(req) {
  return await StackholderController.update(req);
}

export async function DELETE(req) {
  return await StackholderController.delete(req);
}



