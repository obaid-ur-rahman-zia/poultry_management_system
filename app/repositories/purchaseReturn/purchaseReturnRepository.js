import prisma from "@/lib/prisma";

class PurchaseReturnRepository {
  async readAll() {
    return prisma.purchase_return.findMany({
      orderBy: { purchase_return_id: "asc" },
      select: {
        purchase_return_id: true,
      },
    });
  }

  async readNextId() {
    const maxId = await prisma.purchase_return.aggregate({
      _max: { purchase_return_id: true },
    });
    return (maxId._max.purchase_return_id || 0) + 1;
  }

  async readById(purchase_return_id) {
    return prisma.purchase_return.findUnique({
      where: { purchase_return_id: Number(purchase_return_id) },
      include: {
        products: {
          include: {
            product: true,
            return_type: true,
          },
        },
        suppliers: true,
      },
    });
  }

  async create(req_object, tx) {
    // Use the passed transaction instead of creating a new one
    const purchaseReturn = await tx.purchase_return.create(
      {
        data: {
          return_dat: new Date(req_object.return_dat),
          acc_id: req_object.supplier_id,
          subtotal_amount: Number(req_object.subtotal_amount),
          total_amount: Number(req_object.total_amount),
          total_discount: Number(req_object.total_discount),
          bill_tax: Number(req_object.bill_tax),
          packing_fare: Number(req_object.packing_fare),
          loading_fare: Number(req_object.loading_fare),
          received_amount: Number(req_object.received_amount),
          remarks: req_object.remarks,
          products: {
            create: req_object.items.map((item) => ({
              product_id: item.product_id,
              warehouse_id: item.warehouse_id,
              return_type_id: item.return_type_id,
              packing: Number(item.packing),
              quantity: Number(item.quantity),
              total_unit: Number(item.total_unit),
              purchase_price: Number(item.purchase_price),
              unit_price: Number(item.unit_price),
              sale_price: Number(item.sale_price),
              prod_subtotal_amount: Number(item.prod_subtotal_amount),
              discount_amount: Number(item.discount_amount),
              tax_amount: Number(item.tax_amount),
              total_discount_amount: Number(item.total_discount_amount),
              total_tax_amount: Number(item.total_tax_amount),
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
      const stockToReduce = Number(item.total_unit);

      await tx.product.update({
        where: { product_id: item.product_id },
        data: {
          current_stock: {
            decrement: stockToReduce,
          },
        },
      });
    }

    return purchaseReturn;
  }

  async update(req_object, tx) {
    const oldReturn = await tx.purchase_return.findUnique({
      where: { purchase_return_id: Number(req_object.purchase_return_id) },
      include: {
        products: true,
      },
    });

    if (!oldReturn) {
      throw new Error("Return not found");
    }

    // 2. Reverse the old stock quantities
    for (const oldItem of oldReturn.products) {
      const oldStock = Number(oldItem.total_unit);

      await tx.product.update({
        where: { product_id: oldItem.product_id },
        data: {
          current_stock: {
            increment: oldStock,
          },
        },
      });
    }

    // 3. Update the purchase with new products
    const updatedReturn = await tx.purchase_return.update(
      {
        where: { purchase_return_id: Number(req_object.purchase_return_id) },
        data: {
          return_dat: new Date(req_object.return_dat),
          acc_id: req_object.supplier_id,
          subtotal_amount: Number(req_object.subtotal_amount),
          total_amount: Number(req_object.total_amount),
          total_discount: Number(req_object.total_discount),
          bill_tax: Number(req_object.bill_tax),
          packing_fare: Number(req_object.packing_fare),
          loading_fare: Number(req_object.loading_fare),
          received_amount: Number(req_object.received_amount),
          remarks: req_object.remarks,
          products: {
            deleteMany: {},
            create: req_object.items.map((item) => ({
              product_id: item.product_id,
              warehouse_id: item.warehouse_id,
              return_type_id: item.return_type_id,
              packing: Number(item.packing),
              quantity: Number(item.quantity),
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
      const stockToReduce = Number(item.total_unit);

      await tx.product.update({
        where: { product_id: item.product_id },
        data: {
          current_stock: {
            decrement: stockToReduce,
          },
        },
      });
    }

    return updatedReturn;
  }
}

export default new PurchaseReturnRepository();
