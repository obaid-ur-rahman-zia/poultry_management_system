import prisma from "@/lib/prisma";

class QuotationsRepository {
  async readAll() {
    return prisma.quotation.findMany({
      orderBy: { quotation_id: "asc" },
      select: {
        quotation_id: true,
      },
    });
  }

  async readNextId() {
    const maxId = await prisma.quotation.aggregate({
      _max: { quotation_id: true },
    });
    return (maxId._max.quotation_id || 0) + 1;
  }

  async readById(quotation_id) {
    return prisma.quotation.findUnique({
      where: { quotation_id: Number(quotation_id) },
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

  async create(req_object) {
    const quotation = await prisma.quotation.create({
      data: {
        salesman_id: req_object.salesman_id,
        customer_id: req_object.customer_id,
        subtotal_amount: Number(req_object.subtotal_amount),
        total_amount: Number(req_object.total_amount),
        total_discount: Number(req_object.total_discount),
        total_tax: Number(req_object.total_tax),
        packing_fare: Number(req_object.packing_fare || 0),
        extra_tax: Number(req_object.extra_tax || 0),
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
    return quotation;
  }

  async update(req_object) {
    const updatedPurchase = await prisma.quotation.update({
      where: { quotation_id: Number(req_object.quotation_id) },
      data: {
        salesman_id: req_object.salesman_id,
        customer_id: req_object.customer_id,
        subtotal_amount: Number(req_object.subtotal_amount),
        total_amount: Number(req_object.total_amount),
        total_discount: Number(req_object.total_discount),
        total_tax: Number(req_object.total_tax),
        packing_fare: Number(req_object.packing_fare || 0),
        extra_tax: Number(req_object.extra_tax || 0),
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
            sale_price: Number(item.sale_price),
            unit_price: Number(item.unit_price),
            prod_subtotal_amount: Number(item.prod_subtotal_amount),
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
    return updatedPurchase;
  }
}

export default new QuotationsRepository();
