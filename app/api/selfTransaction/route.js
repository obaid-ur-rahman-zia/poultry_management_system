import SelfTransactionController from "@/app/controllers/selfTransaction/selfTransactionController";

/**
 * @swagger
 * /api/selfTransaction:
 *   post:
 *     summary: Create a self transaction
 *     description: Create a self (single-account) transaction. Request body must be wrapped in req_object. Fields include transaction_date, is_bank, account_id, transaction_type, amount, description.
 *     tags: [Transactions]
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
 *                 description: transaction_date, account_id, transaction_type, amount, description, is_bank (0/1)
 *           example:
 *             req_object:
 *               transaction_date: "2024-01-15"
 *               is_bank: 0
 *               account_id: 1
 *               transaction_type: "debit"
 *               amount: 5000
 *               description: "Cash expense"
 *     responses:
 *       201:
 *         description: Self transaction created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(req) {
  return SelfTransactionController.create(req);
}

/**
 * @swagger
 * /api/selfTransaction:
 *   put:
 *     summary: Update a self transaction
 *     description: Update an existing self transaction. Request body must be wrapped in req_object. Include transaction_id for update.
 *     tags: [Transactions]
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
 *                 description: transaction_id (required), transaction_date, account_id, transaction_type, amount, description, is_bank
 *           example:
 *             req_object:
 *               transaction_id: 1
 *               transaction_date: "2024-01-15"
 *               account_id: 1
 *               transaction_type: "credit"
 *               amount: 6000
 *               description: "Updated"
 *     responses:
 *       200:
 *         description: Self transaction updated successfully
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req) {
  return SelfTransactionController.update(req);
}

/**
 * @swagger
 * /api/selfTransaction:
 *   delete:
 *     summary: Delete a self transaction
 *     description: Delete a self transaction (typically via query param or body with transaction_id).
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Self transaction deleted successfully
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(req) {
  return SelfTransactionController.delete(req);
}

