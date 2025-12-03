import transactionRepository from "@/app/repositories/transaction/transactionRepository";
import { AccountConfigService } from "@/app/utils/accountConfigService";
import RedisService from "@/app/utils/redis";
import { calculateFinancialYear } from "@/app/components/calculateFinYear/financialYear";

export async function createTransactions(purchaseReturn, items, tx) {
  // Validate purchase object
  if (!purchaseReturn || !purchaseReturn.purchase_return_id) {
    throw new Error("Invalid purchase object provided to createTransactions");
  }

  const ConfigService = new AccountConfigService();

  try {
    // Fetch all account configs with validation
    const cashAccountConfig = await ConfigService.getAccountConfig(
      "Cash In Hand Acc",
      tx
    );
    const returnAccountConfig = await ConfigService.getAccountConfig(
      "Purchase Return Acc",
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
      throw new Error("Purchase account (Cash In Hand Acc) not configured");
    }
    if (!returnAccountConfig?.acc_id) {
      throw new Error("Purchase account (Purchase Acc) not configured");
    }
    if (!discountAccountConfig?.acc_id) {
      throw new Error(
        "Discount account (Purchase Discount Acc) not configured"
      );
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
    const return_account = returnAccountConfig.acc_id;
    const discount_account = discountAccountConfig.acc_id;
    const tax_account = taxAccountConfig.acc_id;
    const loading_fare_account = loadingFareAccountConfig.acc_id;
    const packing_fare_account = packingFareAccountConfig.acc_id;
    const financialYear = calculateFinancialYear(
      new Date().toISOString().split("T")[0]
    );
    const returnConstants = {
      reference_id: purchaseReturn.purchase_return_id,
      remarks: "Purchase Return#" + purchaseReturn.purchase_return_id,
      financial_year: financialYear,
      reference: "Purchase Return",
    };
    // Validate purchase.acc_id exists
    if (!purchaseReturn.acc_id) {
      throw new Error(" Return account ID is missing");
    }

    const transactionData = [];

    const pending =
      purchaseReturn.total_amount - purchaseReturn.received_amount;

    // 1) Handle cash paid (if any)
    if (purchaseReturn.received_amount > 0) {
      transactionData.push({
        acc_id: cash_account,
        debit: purchaseReturn.received_amount,
        ...returnConstants,
      });
    }

    // 2) Handle supplier pending (full OR partial)
    if (pending > 0) {
      transactionData.push({
        acc_id: purchaseReturn.acc_id, // supplier
        debit: pending,
        ...returnConstants,
      });
    }

    // Subtotal Amount
    if (purchaseReturn.subtotal_amount > 0) {
      transactionData.push({
        acc_id: return_account,
        credit: purchaseReturn.subtotal_amount,
        ...returnConstants,
      });
    }

    // Discount Amount - FIXED
    if (purchaseReturn.total_discount > 0) {
      transactionData.push({
        acc_id: discount_account,
        debit: purchaseReturn.total_discount,
        ...returnConstants,
      });
    }

    // Tax Amount - CORRECT
    if (purchaseReturn.bill_tax > 0) {
      transactionData.push({
        acc_id: tax_account,
        credit: purchaseReturn.bill_tax,
        ...returnConstants,
      });
    }

    // Loading Fare - CORRECT
    if (purchaseReturn.loading_fare > 0) {
      transactionData.push({
        acc_id: loading_fare_account,
        credit: purchaseReturn.loading_fare,
        ...returnConstants,
      });
    }

    // Packing Fare - CORRECT
    if (purchaseReturn.packing_fare > 0) {
      transactionData.push({
        acc_id: packing_fare_account,
        credit: purchaseReturn.packing_fare,
        ...returnConstants,
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
