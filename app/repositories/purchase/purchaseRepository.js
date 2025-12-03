import prisma from "@/lib/prisma";

class PurchaseRepository {
  async readAll() {
    return prisma.purchase.findMany({
      orderBy: { purchase_id: "asc" },
      select: {
        purchase_id: true,
      },
    });
  }

  async readNextId() {
    const maxId = await prisma.purchase.aggregate({
      _max: { purchase_id: true },
    });
    return (maxId._max.purchase_id || 0) + 1;
  }

  async readById(purchase_id) {
    return prisma.purchase.findUnique({
      where: { purchase_id: Number(purchase_id) },
      include: {
        products: {
          include: {
            product: true,
          },
        },
        suppliers: true,
      },
    });
  }

  async create(req_object, tx) {
    // Use the passed transaction instead of creating a new one
    const purchase = await tx.purchase.create(
      {
        data: {
          invoice_dat: new Date(req_object.invoice_dat),
          invoice_id: req_object.invoice_id,
          purchase_dat: new Date(req_object.purchase_dat),
          acc_id: req_object.supplier_id,
          subtotal_amount: Number(req_object.subtotal_amount),
          total_amount: Number(req_object.total_amount),
          total_discount: Number(req_object.total_discount),
          bill_tax: Number(req_object.bill_tax),
          packing_fare: Number(req_object.packing_fare),
          loading_fare: Number(req_object.loading_fare),
          adjust_up: Number(req_object.adjust_up),
          paid_amount: Number(req_object.paid_amount),
          remarks: req_object.remarks,
          products: {
            create: req_object.items.map((item) => ({
              product_id: item.product_id,
              warehouse_id: item.warehouse_id,
              packing: Number(item.packing),
              quantity: Number(item.quantity),
              bonus: Number(item.bonus) || 0,
              total_unit: Number(item.total_unit),
              purchase_price: Number(item.purchase_price),
              unit_price: Number(item.unit_price),
              sale_price: Number(item.sale_price),
              prod_subtotal_amount: Number(item.prod_subtotal_amount),
              discount_amount: Number(item.discount_amount),
              total_discount_amount: Number(item.total_discount_amount),
              total_tax_amount: Number(item.total_tax_amount),
              tax_amount: Number(item.tax_amount),
              batch: item.batch,
              expiry: item.expiry ? new Date(item.expiry) : null,
              net_amount: Number(item.net_amount),
              isTaxApplied: item.isTaxApplied,
              isDiscountApplied: item.isDiscountApplied,
              isTaxPercentage: item.isTaxPercentage,
              isDiscountedPercentage: item.isDiscountedPercentage,
              isTaxAppliedCondition: item.isTaxAppliedCondition,
            })),
          },
        },
      },
      {
        maxWait: 10000, // 10s to get connection from pool
        timeout: 5000, // 30s for entire transaction (was 10s)
      }
    );

    // Update stock for each product
    for (const item of req_object.items) {
      const stockToAdd = Number(item.total_unit);
      const avgPrice = await tx.product.findUnique({
        where: { product_id: item.product_id },
        select: { avg_price: true },
      });
      const newAvgPrice =
        (Number(avgPrice.avg_price) + Number(item.purchase_price)) / 2;

      await tx.product.update({
        where: { product_id: item.product_id },
        data: {
          current_stock: {
            increment: stockToAdd,
          },
          avg_price: newAvgPrice,
        },
      });
    }

    return purchase;
  }

  async update(req_object, tx) {
    const oldPurchase = await tx.purchase.findUnique({
      where: { purchase_id: Number(req_object.purchase_id) },
      include: {
        products: true,
      },
    });

    if (!oldPurchase) {
      throw new Error("Purchase not found");
    }

    // 2. Reverse the old stock quantities
    for (const oldItem of oldPurchase.products) {
      const oldStock = Number(oldItem.total_unit);

      await tx.product.update({
        where: { product_id: oldItem.product_id },
        data: {
          current_stock: {
            decrement: oldStock,
          },
        },
      });
    }

    // 3. Update the purchase with new products
    const updatedPurchase = await tx.purchase.update(
      {
        where: { purchase_id: Number(req_object.purchase_id) },
        data: {
          invoice_dat: new Date(req_object.invoice_dat),
          invoice_id: req_object.invoice_id,
          purchase_dat: new Date(req_object.purchase_dat),
          acc_id: req_object.supplier_id,
          subtotal_amount: Number(req_object.subtotal_amount),
          total_amount: Number(req_object.total_amount),
          total_discount: Number(req_object.total_discount),
          bill_tax: Number(req_object.bill_tax),
          packing_fare: Number(req_object.packing_fare),
          loading_fare: Number(req_object.loading_fare),
          adjust_up: Number(req_object.adjust_up),
          paid_amount: Number(req_object.paid_amount),
          remarks: req_object.remarks,
          products: {
            deleteMany: {},
            create: req_object.items.map((item) => ({
              product_id: item.product_id,
              warehouse_id: item.warehouse_id,
              packing: Number(item.packing),
              quantity: Number(item.quantity),
              bonus: Number(item.bonus) || 0,
              total_unit: Number(item.total_unit),
              purchase_price: Number(item.purchase_price),
              unit_price: Number(item.unit_price),
              sale_price: Number(item.sale_price),
              prod_subtotal_amount: Number(item.prod_subtotal_amount),
              discount_amount: Number(item.discount_amount),
              total_discount_amount: Number(item.total_discount_amount),
              total_tax_amount: Number(item.total_tax_amount),
              tax_amount: Number(item.tax_amount),
              batch: item.batch,
              expiry: item.expiry ? new Date(item.expiry) : null,
              net_amount: Number(item.net_amount),
              isTaxApplied: item.isTaxApplied,
              isDiscountApplied: item.isDiscountApplied,
              isTaxPercentage: item.isTaxPercentage,
              isDiscountedPercentage: item.isDiscountedPercentage,
              isTaxAppliedCondition: item.isTaxAppliedCondition,
            })),
          },
        },
      },
      {
        maxWait: 10000, // 10s to get connection from pool
        timeout: 5000, // 30s for entire transaction (was 10s)
      }
    );

    // 4. Add the new stock quantities
    for (const item of req_object.items) {
      const stockToAdd = Number(item.total_unit);

      await tx.product.update({
        where: { product_id: item.product_id },
        data: {
          current_stock: {
            increment: stockToAdd,
          },
        },
      });
    }

    return updatedPurchase;
  }

  // Optional: Delete method with stock reversal
  async delete(purchase_id) {
    return prisma.$transaction(
      async (tx) => {
        // Get purchase data
        const purchase = await tx.purchase.findUnique({
          where: { purchase_id: Number(purchase_id) },
          include: {
            products: true,
          },
        });

        if (!purchase) {
          throw new Error("Purchase not found");
        }

        // Reverse stock for all products
        for (const item of purchase.products) {
          const stockToRemove = Number(item.quantity) + Number(item.bonus || 0);

          await tx.product.update({
            where: { product_id: item.product_id },
            data: {
              current_stock: {
                decrement: stockToRemove,
              },
            },
          });
        }

        // Delete the purchase (products will cascade delete)
        await tx.purchase.delete({
          where: { purchase_id: Number(purchase_id) },
        });

        return { message: "Purchase deleted and stock reversed successfully" };
      },
      {
        timeout: 10000, // ⏱ 10 seconds
        maxWait: 5000, // optional: how long to wait for a connection (5s)
      }
    );
  }

  async readReportDetail(req_object) {
    const { start_dat, end_dat } = req_object;

    return prisma.purchase.findMany({
      where: {
        purchase_dat: {
          gte: new Date(start_dat),
          lte: new Date(end_dat),
        },
        is_deleted: false,
      },
      include: {
        suppliers: {
          select: {
            account_nam: true,
            account_contact: true,
          },
        },
        products: {
          include: {
            product: {
              select: {
                product_title: true,
              },
            },
          },
          orderBy: {
            id: "asc",
          },
        },
      },
      orderBy: {
        purchase_dat: "asc",
      },
    });
  }
}

export default new PurchaseRepository();
