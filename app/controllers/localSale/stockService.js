const SLOT_FIELDS = [
  ["weight_one", "rate_one"],
  ["weight_two", "rate_two"],
  ["weight_three", "rate_three"],
];

const isPositive = (value) => Number(value) > 0;

async function syncAccountStock(localAccountId, tx) {
  const lots = await tx.stock_lot.findMany({
    where: { local_account: localAccountId, status: 1, remaining_weight: { gt: 0 } },
    orderBy: { stock_lot_id: "asc" },
    take: 3,
  });

  const data = {};
  for (const [weightField, rateField] of SLOT_FIELDS) {
    data[weightField] = null;
    data[rateField] = null;
  }

  lots.forEach((lot, index) => {
    const [weightField, rateField] = SLOT_FIELDS[index];
    data[weightField] = lot.remaining_weight;
    data[rateField] = lot.rate;
  });

  await tx.accounts.update({ where: { acc_id: localAccountId }, data });
}

async function importLegacyLots(localAccountId, tx) {
  const existingLots = await tx.stock_lot.count({
    where: { local_account: localAccountId, status: 1, remaining_weight: { gt: 0 } },
  });
  if (existingLots > 0) return;

  const account = await tx.accounts.findUnique({ where: { acc_id: localAccountId } });
  if (!account) throw new Error("Local account not found");

  const lots = SLOT_FIELDS
    .map(([weightField, rateField]) => ({
      weight: account[weightField],
      rate: account[rateField],
    }))
    .filter(({ weight }) => isPositive(weight));

  for (const lot of lots) {
    if (!Number.isFinite(Number(lot.rate))) {
      throw new Error("Local account stock has a weight without a valid rate");
    }
    await tx.stock_lot.create({
      data: {
        local_account: localAccountId,
        original_weight: Number(lot.weight),
        remaining_weight: Number(lot.weight),
        rate: Number(lot.rate),
      },
    });
  }

  if (lots.length > 0) await syncAccountStock(localAccountId, tx);
}

export async function isLocalSaleAccount(account, tx) {
  const localAccount = typeof account === "object" && account !== null
    ? account
    : await tx.accounts.findUnique({
        where: { acc_id: Number(account) },
        include: { head: true, subhead: true },
      });
  if (!localAccount) return false;
  const headName = (localAccount.head?.head_nam || "").toLowerCase();
  const subheadName = (localAccount.subhead?.subhead_nam || "").toLowerCase();
  return headName.includes("local sale") || subheadName.includes("local sale");
}

export async function createStockLot(localAccountId, sourceSaleId, weight, rate, tx) {
  const numericWeight = Number(weight);
  const numericRate = Number(rate);
  if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
    throw new Error("Stock weight must be greater than zero");
  }
  if (!Number.isFinite(numericRate)) throw new Error("Stock rate is required");

  await importLegacyLots(Number(localAccountId), tx);
  const activeLots = await tx.stock_lot.count({
    where: { local_account: Number(localAccountId), status: 1, remaining_weight: { gt: 0 } },
  });
  if (activeLots >= 3) {
    throw new Error("Local sale account has reached the maximum of 3 weight records. Please sell some stock first.");
  }

  const lot = await tx.stock_lot.create({
    data: {
      local_account: Number(localAccountId),
      source_sale_id: Number(sourceSaleId),
      original_weight: numericWeight,
      remaining_weight: numericWeight,
      rate: numericRate,
    },
  });
  await syncAccountStock(Number(localAccountId), tx);
  return lot;
}

export async function allocateStock(localAccountId, localSaleId, weight, tx) {
  const requestedWeight = Number(weight);
  if (!Number.isFinite(requestedWeight) || requestedWeight <= 0) {
    throw new Error("Local sale weight must be greater than zero");
  }

  await importLegacyLots(Number(localAccountId), tx);
  const lots = await tx.stock_lot.findMany({
    where: { local_account: Number(localAccountId), status: 1, remaining_weight: { gt: 0 } },
    orderBy: { stock_lot_id: "asc" },
  });
  const available = lots.reduce((sum, lot) => sum + lot.remaining_weight, 0);
  if (requestedWeight > available) {
    throw new Error(`Cannot sell more than available stock in local account. Available stock: ${available}`);
  }

  let remaining = requestedWeight;
  const allocations = [];
  for (const lot of lots) {
    if (remaining <= 0) break;
    const allocatedWeight = Math.min(remaining, lot.remaining_weight);
    await tx.stock_lot.update({
      where: { stock_lot_id: lot.stock_lot_id },
      data: {
        remaining_weight: lot.remaining_weight - allocatedWeight,
        status: lot.remaining_weight - allocatedWeight > 0 ? 1 : 0,
      },
    });
    allocations.push({ stock_lot_id: lot.stock_lot_id, weight: allocatedWeight, rate: lot.rate });
    remaining -= allocatedWeight;
  }

  await tx.local_sale_stock_allocation.createMany({
    data: allocations.map((allocation) => ({ local_sale_id: Number(localSaleId), ...allocation })),
  });
  await syncAccountStock(Number(localAccountId), tx);
  return allocations;
}

export async function restoreStock(localSaleId, tx) {
  const allocations = await tx.local_sale_stock_allocation.findMany({
    where: { local_sale_id: Number(localSaleId) },
  });
  const accountIds = new Set();

  for (const allocation of allocations) {
    const lot = await tx.stock_lot.findUnique({ where: { stock_lot_id: allocation.stock_lot_id } });
    if (!lot) throw new Error("Stock allocation source no longer exists");
    await tx.stock_lot.update({
      where: { stock_lot_id: lot.stock_lot_id },
      data: { remaining_weight: lot.remaining_weight + allocation.weight, status: 1 },
    });
    accountIds.add(lot.local_account);
  }

  await tx.local_sale_stock_allocation.deleteMany({ where: { local_sale_id: Number(localSaleId) } });
  for (const accountId of accountIds) await syncAccountStock(accountId, tx);
  return allocations;
}

export async function reverseStockLot(sourceSaleId, tx) {
  const lot = await tx.stock_lot.findUnique({ where: { source_sale_id: Number(sourceSaleId) } });
  if (!lot) return;
  const consumed = lot.original_weight - lot.remaining_weight;
  if (consumed > 0) {
    throw new Error("Cannot change or delete whole sale stock that has already been sold");
  }
  await tx.stock_lot.delete({ where: { stock_lot_id: lot.stock_lot_id } });
  await syncAccountStock(lot.local_account, tx);
}

export async function updateStockLot(sourceSaleId, localAccountId, weight, rate, tx) {
  const lot = await tx.stock_lot.findUnique({ where: { source_sale_id: Number(sourceSaleId) } });
  if (!lot) {
    await importLegacyLots(Number(localAccountId), tx);
    return createStockLot(localAccountId, sourceSaleId, weight, rate, tx);
  }

  const consumed = lot.original_weight - lot.remaining_weight;
  if (consumed > 0 && lot.local_account !== Number(localAccountId)) {
    throw new Error("Cannot move whole sale stock after part of it has been sold");
  }
  const numericWeight = Number(weight);
  const numericRate = Number(rate);
  if (!Number.isFinite(numericRate)) throw new Error("Stock rate is required");
  if (!Number.isFinite(numericWeight) || numericWeight < consumed) {
    throw new Error("Updated whole sale weight cannot be less than stock already sold");
  }
  await tx.stock_lot.update({
    where: { stock_lot_id: lot.stock_lot_id },
    data: {
      local_account: Number(localAccountId),
      original_weight: numericWeight,
      remaining_weight: numericWeight - consumed,
      rate: numericRate,
      status: numericWeight - consumed > 0 ? 1 : 0,
    },
  });
  await syncAccountStock(lot.local_account, tx);
  if (lot.local_account !== Number(localAccountId)) await syncAccountStock(Number(localAccountId), tx);
}
