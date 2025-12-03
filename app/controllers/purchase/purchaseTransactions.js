import transactionRepository from "@/app/repositories/transaction/transactionRepository";
import { AccountConfigService } from "@/app/utils/accountConfigService";
import RedisService from "@/app/utils/redis";
import { calculateFinancialYear } from "@/app/components/calculateFinYear/financialYear";
export async function createTransactions(purchase, items, tx) {
  // Validate purchase object
  if (!purchase || !purchase.purchase_id) {
    throw new Error("Invalid purchase object provided to createTransactions");
  }

  const ConfigService = new AccountConfigService();

  try {
    // Fetch all account configs with validation
    const cashAccountConfig = await ConfigService.getAccountConfig(
      "Cash In Hand Acc",
      tx
    );
    const purchaseAccountConfig = await ConfigService.getAccountConfig(
      "Purchase Acc",
      tx
    );
    const discountAccountConfig = await ConfigService.getAccountConfig(
      "Purchase Discount Acc",
      tx
    );
    const taxAccountConfig = await ConfigService.getAccountConfig(
      "Taxes Acc",
      tx
    );
    const loadingFareAccountConfig = await ConfigService.getAccountConfig(
      "Loading Acc",
      tx
    );
    const packingFareAccountConfig = await ConfigService.getAccountConfig(
      "Packing Acc",
      tx
    );

    // Validate all accounts exist
    if (!cashAccountConfig?.acc_id) {
      throw new Error("(Cash In Hand Acc) not configured");
    }
    if (!purchaseAccountConfig?.acc_id) {
      throw new Error("(Purchase Acc) not configured");
    }
    if (!discountAccountConfig?.acc_id) {
      throw new Error("(Purchase Discount Acc) not configured");
    }
    if (!taxAccountConfig?.acc_id) {
      throw new Error("Tax account (Taxes Acc) not configured");
    }
    if (!loadingFareAccountConfig?.acc_id) {
      throw new Error("Loading account (Loading Acc) not configured");
    }
    if (!packingFareAccountConfig?.acc_id) {
      throw new Error("Packing account (Packing Acc) not configured");
    }

    const cash_account = cashAccountConfig.acc_id;
    const purchase_account = purchaseAccountConfig.acc_id;
    const discount_account = discountAccountConfig.acc_id;
    const tax_account = taxAccountConfig.acc_id;
    const loading_fare_account = loadingFareAccountConfig.acc_id;
    const packing_fare_account = packingFareAccountConfig.acc_id;

    // Validate purchase.acc_id exists
    if (!purchase.acc_id) {
      throw new Error("Purchase account ID is missing");
    }

    const transactionData = [];

    const pending = purchase.total_amount - purchase.paid_amount;

    const financialYear = calculateFinancialYear(
      new Date().toISOString().split("T")[0]
    );

    const purchaseConstants = {
      reference_id: purchase.purchase_id,
      remarks:
        "Purchase#" +
        purchase.purchase_id +
        " Ref Invoice#" +
        purchase.invoice_id,
      financial_year: financialYear,
      reference: "Purchase",
    };
    // 1) Handle cash paid (if any)
    if (purchase.paid_amount > 0) {
      transactionData.push({
        acc_id: cash_account,
        credit: purchase.paid_amount,
        ...purchaseConstants,
      });
    }

    // 2) Handle supplier pending (full OR partial)
    if (pending > 0) {
      transactionData.push({
        acc_id: purchase.acc_id, // supplier
        credit: pending,
        ...purchaseConstants,
      });
    }

    // Subtotal Amount
    if (purchase.subtotal_amount > 0) {
      transactionData.push({
        acc_id: purchase_account,
        debit: purchase.subtotal_amount,
        ...purchaseConstants,
      });
    }

    // Discount Amount - FIXED
    if (purchase.total_discount > 0) {
      transactionData.push({
        acc_id: discount_account,
        credit: purchase.total_discount,
        ...purchaseConstants,
      });
    }

    // Tax Amount - CORRECT
    if (purchase.bill_tax > 0) {
      transactionData.push({
        acc_id: tax_account,
        debit: purchase.bill_tax,
        ...purchaseConstants,
      });
    }

    // Loading Fare - CORRECT
    if (purchase.loading_fare > 0) {
      transactionData.push({
        acc_id: loading_fare_account,
        debit: purchase.loading_fare,
        ...purchaseConstants,
      });
    }

    // Packing Fare - CORRECT
    if (purchase.packing_fare > 0) {
      transactionData.push({
        acc_id: packing_fare_account,
        debit: purchase.packing_fare,
        ...purchaseConstants,
      });
    }

    // Create all transactions - any failure will throw and rollback
    for (const data of transactionData) {
      const result = await transactionRepository.create(data, tx);
      if (!result) {
        throw new Error(`Failed to create transaction`);
      }
    }

    await RedisService.del("transactions:all");

    // Return success indicator
    return { success: true, transactionCount: transactionData.length };
  } catch (error) {
    // Log the specific error for debugging
    console.error("Error in createTransactions:", error);
    // Re-throw to trigger transaction rollback
    throw new Error(`Failed to create transactions: ${error.message}`);
  }
}

// const expanseAssetAccountConfig = await ConfigService.getAccountConfig(
//   "Expanse Asset Acc",
//   tx
// );

// if (!expanseAssetAccountConfig?.acc_id) {
//   throw new Error(
//     "Expanse Asset account (Expanse Asset Acc) not configured"
//   );
// }

// const expanse_asset_account = expanseAssetAccountConfig.acc_id;

//Product Transaction
// Product-Level Expanse Asset Entries
// console.log("Purchase Items", items);
// if (Array.isArray(items)) {
//   items.forEach((item) => {
//     const productTotalAmount = Number(item.net_amount) || 0;
//     const totalUnits = Number(item.total_unit) || 0;
//     const totalDiscount = Number(item.discount_amount) || 0;
//     const totalTax = Number(item.tax_amount) || 0;
//     console.log("Creating Product Transaction");
//     if (productTotalAmount > 0) {
//       transactionData.push(
//         {
//           acc_id: expanse_asset_account,
//           debit: productTotalAmount,
//           reference_id: purchase.purchase_id,
//           reference: "Purchase",
//           remarks: `Units: ${totalUnits}, Discount/Unit: ${totalDiscount}, Tax/Unit: ${totalTax}`,
//         },
//         {
//           acc_id: purchase.acc_id, // supplier account
//           credit: productTotalAmount,
//           reference_id: purchase.purchase_id,
//           reference: "Purchase",
//           remarks: `Units: ${totalUnits}, Discount/Unit: ${totalDiscount}, Tax/Unit: ${totalTax}`,
//         }
//       );
//     }
//   });
// }
