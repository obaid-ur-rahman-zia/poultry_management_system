
export async function PUT(req) {
  return transactionController.update(req);
}

export async function POST(req) {
  return transactionController.create(req);
}
