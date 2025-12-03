import prisma from "@/lib/prisma";

class SalesRepository {
  async readAll() {
    return prisma.sale.findMany({
      orderBy: { sale_id: "asc" },
      select: {
        sale_id: true,
      },
    });
  }

  async readNextId() {
    const maxId = await prisma.sale.aggregate({
      _max: { sale_id: true },
    });
    return (maxId._max.sale_id || 0) + 1;
  }

  async readById(sale_id) {
    return prisma.sale.findUnique({
      where: { sale_id: Number(sale_id) },
      include: {
        products: {
          include: {
            product: true,
          },
        },
        customer: true,
        salesman: true,
      },
    });
  }

  async readByProduct(req_object) {
    const { product_id, customer_id } = req_object;

    return prisma.sale.findMany({
      where: {
        customer_id: customer_id,
        products: {
          some: {
            product_id: product_id,
          },
        },
      },
      include: {
        products: {
          where: {
            product_id: product_id,
          },
          include: {
            product: {
              select: {
                product_id: true,
                product_title: true,
              },
            },
          },
        },
        customer: {
          select: {
            acc_id: true,
            account_nam: true,
          },
        },
      },
      orderBy: {
        sale_id: "desc",
      },
    });
  }

  async create(req_object, tx) {
    // Use the passed transaction instead of creating a new one
    const sale = await tx.sale.create({
      data: {
        sale_dat: new Date(req_object.sale_dat),
        bill_by: req_object.bill_by,
        payment: req_object.payment,
        salesman_id: req_object.salesman_id,
        customer_id: req_object.customer_id,
        subtotal_amount: Number(req_object.subtotal_amount),
        total_discount: Number(req_object.total_discount),
        total_tax: Number(req_object.total_tax),
        packing_fare: Number(req_object.packing_fare || 0),
        extra_tax: Number(req_object.extra_tax || 0),

        total_amount: Number(req_object.total_amount),
        received_amount: Number(req_object.received_amount || 0),
        delivered_to: req_object.delivered_to,
        builty_number: req_object.builty_number,
        ogp_number: req_object.ogp_number,
        remarks: req_object.remarks,
        products: {
          create: req_object.items.map((item) => ({
            product_id: item.product_id,
            warehouse_id: item.warehouse_id,
            packing: Number(item.packing),
            quantity: Number(item.quantity),
            bonus: Number(item.bonus) || 0,
            total_unit: Number(item.total_unit),
            sale_price: Number(item.sale_price),
            unit_price: Number(item.unit_price),
            prod_subtotal_amount: Number(item.prod_subtotal_amount),
            discount_amount: Number(item.discount_amount),
            total_discount_amount: Number(item.total_discount_amount),
            total_tax_amount: Number(item.total_tax_amount),
            tax_amount: Number(item.tax_amount),
            net_amount: Number(item.net_amount),
            isTaxApplied: item.isTaxApplied,
            isDiscountApplied: item.isDiscountApplied,
            isTaxPercentage: item.isTaxPercentage,
            isDiscountedPercentage: item.isDiscountedPercentage,
            isTaxAppliedCondition: item.isTaxAppliedCondition,
          })),
        },
      },
    });

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

    return sale;
  }

  async update(req_object, tx) {
    // 1. Get the old sale data to reverse stock changes
    const oldSale = await tx.sale.findUnique({
      where: { sale_id: Number(req_object.sale_id) },
      include: {
        products: true,
      },
    });

    if (!oldSale) {
      throw new Error("Sale not found");
    }

    // 2. Reverse the old stock quantities (add back to stock)
    for (const oldItem of oldSale.products) {
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

    // 3. Update the sale with new products
    const updatedSale = await tx.sale.update({
      where: { sale_id: Number(req_object.sale_id) },
      data: {
        sale_dat: new Date(req_object.sale_dat),
        bill_by: req_object.bill_by,
        payment: req_object.payment,
        salesman_id: req_object.salesman_id,
        customer_id: req_object.customer_id,
        subtotal_amount: Number(req_object.subtotal_amount),
        total_discount: Number(req_object.total_discount),
        total_tax: Number(req_object.total_tax),
        packing_fare: Number(req_object.packing_fare || 0),
        extra_tax: Number(req_object.extra_tax || 0),
        total_amount: Number(req_object.total_amount),
        received_amount: Number(req_object.received_amount || 0),
        delivered_to: req_object.delivered_to,
        builty_number: req_object.builty_number,
        ogp_number: req_object.ogp_number,
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
            unit_price: Number(item.unit_price),
            sale_price: Number(item.sale_price),
            prod_subtotal_amount: Number(item.prod_subtotal_amount),
            discount_amount: Number(item.discount_amount),
            total_discount_amount: Number(item.total_discount_amount),
            total_tax_amount: Number(item.total_tax_amount),
            tax_amount: Number(item.tax_amount),
            net_amount: Number(item.net_amount),
            isTaxApplied: item.isTaxApplied,
            isDiscountApplied: item.isDiscountApplied,
            isTaxPercentage: item.isTaxPercentage,
            isDiscountedPercentage: item.isDiscountedPercentage,
            isTaxAppliedCondition: item.isTaxAppliedCondition,
          })),
        },
      },
    });

    // 4. Reduce stock for new quantities
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

    return updatedSale;
  }

  async readReportDetail(req_object) {
    const { start_dat, end_dat } = req_object;

    return prisma.sale.findMany({
      where: {
        sale_dat: {
          gte: new Date(start_dat),
          lte: new Date(end_dat),
        },
        is_deleted: false,
      },
      include: {
        customer: {
          include: {
            subarea: true,
          },
        },
        products: {
          include: {
            product: true,
          },
          orderBy: {
            id: "asc",
          },
        },
      },
      orderBy: {
        sale_dat: "asc",
      },
    });
  }
}

export default new SalesRepository();
