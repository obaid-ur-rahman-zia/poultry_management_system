import UnitExpenseController from "@/app/controllers/unitExpense/unitExpenseController";

/**
 * @swagger
 * /api/unitExpense:
 *   post:
 *     summary: Create a new unit expense
 *     description: Create a new expense entry for a specific unit (farm/floc). Unit expenses track costs for individual units.
 *     tags: [Unit Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [req_object]
 *             properties:
 *               req_object:
 *                 type: object
 *                 required: [unit_id, expense_date, amount]
 *                 properties:
 *                   unit_id:
 *                     type: string
 *                     description: Unit ID
 *                     example: "1"
 *                   expense_date:
 *                     type: string
 *                     format: date
 *                     description: Expense date
 *                     example: "2024-01-15"
 *                   amount:
 *                     type: number
 *                     description: Expense amount
 *                     example: 30000
 *                   expense_type:
 *                     type: string
 *                     description: Type of expense
 *                     example: "Feed"
 *                   description:
 *                     type: string
 *                     description: Expense description
 *                     example: "Monthly feed expense"
 *           example:
 *             req_object:
 *               unit_id: "1"
 *               expense_date: "2024-01-15"
 *               amount: 30000
 *               expense_type: "Feed"
 *               description: "Monthly feed expense"
 *     responses:
 *       201:
 *         description: Unit expense created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 unit_expense_id: "1"
 *               message: "Unit expense created successfully"
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(req) {
  return UnitExpenseController.create(req);
}

/**
 * @swagger
 * /api/unitExpense:
 *   put:
 *     summary: Update an existing unit expense
 *     description: Update unit expense information in the system.
 *     tags: [Unit Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [req_object]
 *             properties:
 *               req_object:
 *                 type: object
 *                 required: [unit_expense_id]
 *                 properties:
 *                   unit_expense_id:
 *                     type: string
 *                     description: Unit expense ID to update
 *                     example: "1"
 *                   unit_id:
 *                     type: string
 *                     description: Unit ID
 *                     example: "1"
 *                   expense_date:
 *                     type: string
 *                     format: date
 *                     description: Expense date
 *                     example: "2024-01-15"
 *                   amount:
 *                     type: number
 *                     description: Expense amount
 *                     example: 35000
 *                   expense_type:
 *                     type: string
 *                     description: Type of expense
 *                     example: "Feed"
 *                   description:
 *                     type: string
 *                     description: Expense description
 *                     example: "Updated monthly feed expense"
 *           example:
 *             req_object:
 *               unit_expense_id: "1"
 *               unit_id: "1"
 *               expense_date: "2024-01-15"
 *               amount: 35000
 *               expense_type: "Feed"
 *               description: "Updated monthly feed expense"
 *     responses:
 *       200:
 *         description: Unit expense updated successfully
 *       404:
 *         description: Unit expense not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req) {
  return UnitExpenseController.update(req);
}

/**
 * @swagger
 * /api/unitExpense:
 *   delete:
 *     summary: Delete a unit expense
 *     description: Delete a unit expense entry from the system.
 *     tags: [Unit Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - unit_expense_id
 *             properties:
 *               unit_expense_id:
 *                 type: string
 *                 description: Unit expense ID to delete
 *                 example: "1"
 *           example:
 *             unit_expense_id: "1"
 *     responses:
 *       200:
 *         description: Unit expense deleted successfully
 *       404:
 *         description: Unit expense not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(req) {
  return UnitExpenseController.delete(req);
}

