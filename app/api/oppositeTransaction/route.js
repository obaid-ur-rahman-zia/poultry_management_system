import OppositeTransactionController from "@/app/controllers/oppositeTransaction/oppositeTransactionController";

/**
 * @swagger
 * /api/oppositeTransaction:
 *   post:
 *     summary: Create an opposite transaction
 *     description: Create an opposite (two-account: paid_by, received_by) transaction. Request body must be wrapped in req_object. Fields include transaction_date, paid_by, received_by, amount, description, bank_account (optional).
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
 *                 description: transaction_date, paid_by (account_id), received_by (account_id), amount, description, bank_account (optional)
 *           example:
 *             req_object:
 *               transaction_date: "2024-01-15"
 *               paid_by: 1
 *               received_by: 2
 *               amount: 10000
 *               description: "Transfer"
 *     responses:
 *       201:
 *         description: Opposite transaction created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(req) {
  return OppositeTransactionController.create(req);
}

/**
 * @swagger
 * /api/oppositeTransaction:
 *   put:
 *     summary: Update an opposite transaction
 *     description: Update an existing opposite transaction. Request body must be wrapped in req_object. Include transaction_id for update.
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
 *                 description: transaction_id (required), transaction_date, paid_by, received_by, amount, description, bank_account
 *           example:
 *             req_object:
 *               transaction_id: 1
 *               transaction_date: "2024-01-15"
 *               paid_by: 1
 *               received_by: 2
 *               amount: 12000
 *               description: "Updated transfer"
 *     responses:
 *       200:
 *         description: Opposite transaction updated successfully
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req) {
  return OppositeTransactionController.update(req);
}

/**
 * @swagger
 * /api/oppositeTransaction:
 *   delete:
 *     summary: Delete an opposite transaction
 *     description: Delete an opposite transaction (typically via query param or body with transaction_id).
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Opposite transaction deleted successfully
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(req) {
  return OppositeTransactionController.delete(req);
}

