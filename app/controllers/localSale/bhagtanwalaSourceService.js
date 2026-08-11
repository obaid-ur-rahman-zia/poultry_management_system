const BHAGTANWALA_NAME = "Bhagtanwala";

function dayRange(date) {
  const start = date instanceof Date
    ? new Date(date)
    : new Date(`${date}T00:00:00`);
  if (Number.isNaN(start.getTime())) {
    throw new Error("A valid local-sale date is required");
  }
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { gte: start, lt: end };
}

export async function findBhagtanwala(tx) {
  return tx.accounts.findFirst({
    where: {
      account_nam: { equals: BHAGTANWALA_NAME, mode: "insensitive" },
      subhead: { subhead_nam: { equals: "PURCHASER", mode: "insensitive" } },
      status: 1,
    },
    include: { head: true, subhead: true },
  });
}

export async function assertBhagtanwala(accountId, tx) {
  const account = await findBhagtanwala(tx);
  if (!account || account.acc_id !== Number(accountId)) {
    throw new Error("Only the Bhagtanwala account can be used for local sales");
  }
  return account;
}

export async function readSourcesForDate(date, tx) {
  const account = await findBhagtanwala(tx);
  if (!account) return [];
  return tx.bhagtanwala_source.findMany({
    where: {
      account_id: account.acc_id,
      source_date: dayRange(date),
      status: 1,
    },
    orderBy: { source_id: "asc" },
  });
}

export async function createSource(wholeSale, tx) {
  const account = await findBhagtanwala(tx);
  if (!account || account.acc_id !== Number(wholeSale.purcher_account)) return null;
  const weight = Number(wholeSale.weight);
  const rate = Number(wholeSale.purcher_rate);
  if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(rate)) {
    throw new Error("Bhagtanwala whole sale requires a valid weight and purchaser rate");
  }
  return tx.bhagtanwala_source.create({
    data: {
      source_sale_id: wholeSale.sale_id,
      account_id: account.acc_id,
      source_date: new Date(wholeSale.sale_date),
      weight,
      rate,
    },
  });
}

export async function updateSource(wholeSale, tx) {
  const source = await tx.bhagtanwala_source.findUnique({
    where: { source_sale_id: Number(wholeSale.sale_id) },
  });
  const account = await findBhagtanwala(tx);
  const isBhagtanwala = account && account.acc_id === Number(wholeSale.purcher_account);
  if (!source && !isBhagtanwala) return null;
  if (!isBhagtanwala) {
    return tx.bhagtanwala_source.update({
      where: { source_id: source.source_id },
      data: { status: 0 },
    });
  }
  const weight = Number(wholeSale.weight);
  const rate = Number(wholeSale.purcher_rate);
  if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(rate)) {
    throw new Error("Bhagtanwala whole sale requires a valid weight and purchaser rate");
  }
  if (source) {
    return tx.bhagtanwala_source.update({
      where: { source_id: source.source_id },
      data: { account_id: account.acc_id, source_date: new Date(wholeSale.sale_date), weight, rate, status: 1 },
    });
  }
  return createSource(wholeSale, tx);
}

export async function deactivateSource(saleId, tx) {
  return tx.bhagtanwala_source.updateMany({
    where: { source_sale_id: Number(saleId) },
    data: { status: 0 },
  });
}

export async function snapshotSources(localSaleId, date, tx) {
  const sources = await readSourcesForDate(date, tx);
  const totalWeight = sources.reduce((sum, source) => sum + source.weight, 0);
  const requestedWeight = Number((await tx.local_sale.findUnique({
    where: { local_sale_id: Number(localSaleId) },
    select: { purchaser_weight: true },
  }))?.purchaser_weight || 0);
  if (requestedWeight > totalWeight) {
    throw new Error(`Local sale weight cannot exceed Bhagtanwala source weight for ${date}`);
  }
  await tx.local_sale_source_snapshot.deleteMany({ where: { local_sale_id: Number(localSaleId) } });
  if (sources.length) {
    await tx.local_sale_source_snapshot.createMany({
      data: sources.map((source) => ({
        local_sale_id: Number(localSaleId),
        source_id: source.source_id,
        weight: source.weight,
        rate: source.rate,
      })),
    });
  }
  return sources;
}

export { BHAGTANWALA_NAME };
