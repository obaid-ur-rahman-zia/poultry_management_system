import transactionRepository from "@/app/repositories/transaction/transactionRepository";
import { AccountConfigService } from "@/app/utils/accountConfigService";
import RedisService from "@/app/utils/redis";
import { calculateFinancialYear } from "@/app/components/calculateFinYear/financialYear";

export async function createTransactions(sale, items, tx) {
  // Validate sale object
  if (!sale || !sale.sale_id) {
    throw new Error("Invalid sale object provided to createTransactions");
  }

  const ConfigService = new AccountConfigService();

  try {
    // Fetch all account configs with validationd
    const cashAccountConfig = await ConfigService.getAccountConfig(
      "Cash In Hand Acc",
      tx
    );
    const saleAccountConfig = await ConfigService.getAccountConfig(
      "Sale Acc",
      tx
    );
    const saleDiscountAccountConfig = await ConfigService.getAccountConfig(
      "Sale Discount Acc",
      tx
    );
    const fbrTaxAccountConfig = await ConfigService.getAccountConfig(
      "FBR Acc",
      tx
    );
    const saleTaxAccountConfig = await ConfigService.getAccountConfig(
      "Sale Tax Payable",
      tx
    );
    const packingFareAccountConfig = await ConfigService.getAccountConfig(
      "Sale Fare Acc",
      tx
    );

    // Validate all accounts exist
    if (!saleAccountConfig?.acc_id) {
      throw new Error("Sale account (Cash In Hand Acc) not configured");
    }
    if (!saleDiscountAccountConfig?.acc_id) {
      throw new Error(
        "Sale discount account (Sale Discount Acc) not configured"
      );
    }
    if (!saleTaxAccountConfig?.acc_id) {
      throw new Error("Sale tax account (Sale Tax Acc) not configured");
    }
    if (!packingFareAccountConfig?.acc_id) {
      throw new Error("Sale fare account (Sale Fare Acc) not configured");
    }
    if (!fbrTaxAccountConfig?.acc_id) {
      throw new Error("FBR tax account (FBR Acc) not configured");
    }

    const cash_account = cashAccountConfig.acc_id;
    const sale_account = saleAccountConfig.acc_id;
    const sale_discount_account = saleDiscountAccountConfig.acc_id;
    const sale_tax_account = saleTaxAccountConfig.acc_id;
    const sale_fbr_account = fbrTaxAccountConfig.acc_id;
    const packing_fare_account = packingFareAccountConfig.acc_id;
    const financialYear = calculateFinancialYear(
      new Date().toISOString().split("T")[0]
    );
    // Validate sale.customer_id exists
    if (!sale.customer_id) {
      throw new Error("Sale customer ID is missing");
    }

    const transactionData = [];

    // Received Amount Handling (0, partial, full)
    const pending = sale.total_amount - sale.received_amount;

    const saleConstants = {
      reference_id: sale.sale_id,
      remarks:
        "Sale#" +
        sale.sale_id +
        " Builty#" +
        sale.builty_number +
        " OGP#" +
        sale.ogp_number,
      financial_year: financialYear,
      reference: "Sale",
    };

    // 1) If any amount was received, debit that to cash
    if (sale.received_amount > 0) {
      transactionData.push({
        acc_id: cash_account,
        debit: sale.received_amount,
        ...saleConstants,
      });
    }

    // 2) If there is any pending amount, debit that to customer
    if (pending > 0) {
      transactionData.push({
        acc_id: sale.customer_id,
        debit: pending,
        ...saleConstants,
      });
    }

    // SubTotal Amount
    if (sale.subtotal_amount > 0) {
      transactionData.push({
        acc_id: sale_account,
        credit: sale.subtotal_amount,
        ...saleConstants,
      });
    }

    // Discount Amount
    if (sale.total_discount > 0) {
      transactionData.push({
        acc_id: sale_discount_account,
        debit: sale.total_discount,
        ...saleConstants,
      });
    }

    //FBR Tax
    if (sale.extra_tax > 0) {
      transactionData.push({
        acc_id: sale_fbr_account,
        credit: sale.extra_tax,
        ...saleConstants,
      });
    }

    // Tax Amount
    if (sale.total_tax > 0) {
      transactionData.push({
        acc_id: sale_tax_account,
        credit: sale.total_tax,
        ...saleConstants,
      });
    }

    // Packing Fare
    if (sale.packing_fare > 0) {
      transactionData.push({
        acc_id: packing_fare_account,
        credit: sale.packing_fare,
        ...saleConstants,
      });
    }

    // Create all transactions - any failure will throw and rollback
    for (const data of transactionData) {
      const result = await transactionRepository.create(data, tx);
      if (!result) {
        throw new Error(`Failed to create transaction for`);
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

// if (!expanseAssetAccountConfig?.acc_id) {
//   throw new Error(
//     "Expanse Asset account (Expanse Asset Acc) not configured"
//   );
// }
// if (!saleProductCostConfig?.acc_id) {
//   throw new Error(
//     "Sale Product Cost account (Sale Product Cost Acc) not configured"
//   );
// }
// const expanseAssetAccountConfig = await ConfigService.getAccountConfig(
//   "Expanse Asset Acc",
//   tx
// );
// const saleProductCostConfig = await ConfigService.getAccountConfig(
//   "Sale Product Cost Acc",
//   tx
// );

// const expanse_asset_account = expanseAssetAccountConfig.acc_id;
// const sale_product_cost_account = saleProductCostConfig.acc_id;

// Product-Level Entries (Customer Debit, Expanse Asset Credit)
// if (Array.isArray(items)) {
//   items.forEach((item) => {
//     const productTotalAmount = Number(item.net_amount) || 0;
//     const totalUnits = Number(item.total_unit) || 0;
//     const totalDiscount = Number(item.discount_amount) || 0;
//     const totalTax = Number(item.tax_amount) || 0;

//     if (productTotalAmount > 0) {
//       transactionData.push(
//         {
//           acc_id: sale_product_cost_account, // customer owes this much
//           debit: productTotalAmount,
//           reference_id: sale.sale_id,
//           reference: "Sale",
//           remarks: `Units: ${totalUnits}, Discount/Unit: ${totalDiscount}, Tax/Unit: ${totalTax}`,
//         },
//         {
//           acc_id: expanse_asset_account, // coming OUT of asset
//           credit: productTotalAmount,
//           reference_id: sale.sale_id,
//           reference: "Sale",
//           remarks: `Units: ${totalUnits}, Discount/Unit: ${totalDiscount}, Tax/Unit: ${totalTax}`,
//         }
//       );
//     }
//   });
// }
