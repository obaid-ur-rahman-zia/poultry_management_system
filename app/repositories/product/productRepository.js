import prisma from "@/lib/prisma";

class ProductRepository {
  async create(data) {
    return prisma.product.create({
      data: {
        product_title: data.product_title,
        product_description: data.product_description || null,
        prounit_id: data.prounit_id,
        procategory_id: data.procategory_id,
        pgroup_id: data.pgroup_id,
        company_id: data.company_id,
        purchase_price: Number(data.purchase_price),
        sale_price: Number(data.sale_price),
        avg_price: Number(data.purchase_price),
        barcode: data.barcode || null,
        packing: data.packing,
        reorder_level: Number(data.reorder_level) || 0,
        current_stock: 0,
        sales_mc: Number(data.sales_mc) || 0,
        location: data.location || null,
        discount_amount: Number(data.discount_amount) || 0,
        discount_percent: Number(data.discount_percent) || 0,
        tax_amount: Number(data.tax_amount) || 0,
        tax_percent: Number(data.tax_percent) || 0,
        isTaxApplied: data.isTaxApplied || 0,
        isDiscountApplied: data.isDiscountApplied || 0,
        isDiscountedPercentage: data.isDiscountedPercentage || 0,
        isTaxPercentage: data.isTaxPercentage || 0,
        isTaxAppliedCondition: data.isTaxAppliedCondition || 0,
      },
    });
  }

  async checkDuplicate(product_title) {
    return prisma.product.findFirst({
      where: { product_title: product_title },
    });
  }

  async readAll() {
    return prisma.product.findMany({
      orderBy: { product_id: "asc" },
      include: {
        companies: true,
        types: true,
        units: true,
        productGroup: true,
      },
    });
  }

  async readNextId() {
    const maxId = await prisma.product.aggregate({
      _max: { product_id: true },
    });
    return (maxId._max.product_id || 0) + 1;
  }

  async readById(id) {
    return prisma.product.findUnique({
      where: { product_id: Number(id) },
      select: {
        product_id: true,
        product_title: true,
        product_description: true,
        prounit_id: true,
        procategory_id: true,
        pgroup_id: true,
        company_id: true,
        purchase_price: true,
        sale_price: true,
        avg_price: true,
        barcode: true,
        packing: true,
        reorder_level: true,
        current_stock: true,
        sales_mc: true,
        location: true,
        discount_amount: true,
        discount_percent: true,
        tax_amount: true,
        tax_percent: true,
        isTaxApplied: true,
        isDiscountApplied: true,
        isDiscountedPercentage: true,
        isTaxPercentage: true,
        isTaxAppliedCondition: true,
      },
    });
  }

  async update(req_object) {
    const { product_id } = req_object;
    return prisma.product.update({
      where: { product_id: Number(product_id) },
      data: {
        product_title: req_object.product_title,
        product_description: req_object.product_description || null,
        prounit_id: req_object.prounit_id,
        procategory_id: req_object.procategory_id,
        pgroup_id: req_object.pgroup_id,
        company_id: req_object.company_id,
        purchase_price: Number(req_object.purchase_price),
        sale_price: Number(req_object.sale_price),
        barcode: req_object.barcode || null,
        packing: Number(req_object.packing),
        reorder_level: Number(req_object.reorder_level),
        sales_mc: Number(req_object.sales_mc),
        location: req_object.location || null,
        discount_amount: Number(req_object.discount_amount) || 0,
        discount_percent: Number(req_object.discount_percent) || 0,
        tax_amount: Number(req_object.tax_amount) || 0,
        tax_percent: Number(req_object.tax_percent) || 0,
        isTaxApplied: req_object.isTaxApplied || 0,
        isDiscountApplied: req_object.isDiscountApplied || 0,
        isDiscountedPercentage: req_object.isDiscountedPercentage || 0,
        isTaxPercentage: req_object.isTaxPercentage || 0,
        isTaxAppliedCondition: req_object.isTaxAppliedCondition || 0,
      },
    });
  }

  async delete(product_id) {
    // Soft delete by setting status or hard delete
    // For now, using hard delete - you may want to change to soft delete
    return prisma.product.delete({
      where: {
        product_id: Number(product_id),
      },
    });
  }
}

export default new ProductRepository();
