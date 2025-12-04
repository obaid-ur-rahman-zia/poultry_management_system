import prisma from "@/lib/prisma";

class UnitExpenseRepository {
  async readAll() {
    return prisma.unit_expense.findMany({
      orderBy: { expense_id: "desc" },
      include: {
        unit: true,
        floc: true,
        product: true,
      },
      where: {
        status: 1,
      },
    });
  }

  async readById(expense_id) {
    return prisma.unit_expense.findUnique({
      where: {
        expense_id: Number(expense_id),
      },
      include: {
        unit: true,
        floc: true,
        product: true,
      },
    });
  }

  async create(data, tx) {
    const prismaClient = tx || prisma;
    // Support both prounit_id and farm_id for backward compatibility
    const prounit_id = data.prounit_id || data.farm_id;
    return prismaClient.unit_expense.create({
      data: {
        expense_date: new Date(data.expense_date),
        prounit_id: Number(prounit_id),
        floc_id: data.floc_id,
        product_id: data.product_id,
        price: Number(data.price),
        quantity: Number(data.quantity),
        tax_type: data.tax_type || "flat",
        tax_value: Number(data.tax_value) || 0,
        discount_type: data.discount_type || "percentage",
        discount_value: Number(data.discount_value) || 0,
        total: Number(data.total),
        description: data.description || null,
        insert_by: data.insert_by || "user 1",
        update_by: data.update_by || "user 1",
        status: data.status ?? 1,
      },
      include: {
        unit: true,
        floc: true,
        product: true,
      },
    });
  }

  async update(expense_id, req_object, tx) {
    const prismaClient = tx || prisma;
    // Support both prounit_id and farm_id for backward compatibility
    const prounit_id = req_object.prounit_id || req_object.farm_id;
    const updateData = {
      expense_date: req_object.expense_date ? new Date(req_object.expense_date) : undefined,
      floc_id: req_object.floc_id !== undefined ? req_object.floc_id : undefined,
      product_id: req_object.product_id !== undefined ? req_object.product_id : undefined,
      price: req_object.price !== undefined ? Number(req_object.price) : undefined,
      quantity: req_object.quantity !== undefined ? Number(req_object.quantity) : undefined,
      tax_type: req_object.tax_type !== undefined ? req_object.tax_type : undefined,
      tax_value: req_object.tax_value !== undefined ? Number(req_object.tax_value) : undefined,
      discount_type: req_object.discount_type !== undefined ? req_object.discount_type : undefined,
      discount_value: req_object.discount_value !== undefined ? Number(req_object.discount_value) : undefined,
      total: req_object.total !== undefined ? Number(req_object.total) : undefined,
      description: req_object.description !== undefined ? req_object.description : undefined,
      update_by: req_object.update_by || "user 1",
      status: req_object.status ?? 1,
    };
    
    if (prounit_id !== undefined) {
      updateData.prounit_id = Number(prounit_id);
    }
    
    return prismaClient.unit_expense.update({
      where: {
        expense_id: Number(expense_id),
      },
      data: updateData,
      include: {
        unit: true,
        floc: true,
        product: true,
      },
    });
  }

  async delete(expense_id) {
    return prisma.unit_expense.update({
      where: {
        expense_id: Number(expense_id),
      },
      data: {
        status: 0,
      },
    });
  }
}

export default new UnitExpenseRepository();

