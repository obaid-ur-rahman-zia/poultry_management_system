import transactionController from "@/app/controllers/transaction/transactionController";

/**
 * @swagger
 * /api/transaction:
 *   post:
 *     summary: Create a new transaction
 *     description: Create a new financial transaction in the system. Transactions record money movements between accounts.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - debit_acc_id
 *               - credit_acc_id
 *               - amount
 *               - transaction_date
 *             properties:
 *               debit_acc_id:
 *                 type: string
 *                 description: Debit account ID
 *                 example: "1"
 *               credit_acc_id:
 *                 type: string
 *                 description: Credit account ID
 *                 example: "2"
 *               amount:
 *                 type: number
 *                 description: Transaction amount
 *                 example: 5000
 *               transaction_date:
 *                 type: string
 *                 format: date
 *                 description: Transaction date
 *                 example: "2024-01-15"
 *               description:
 *                 type: string
 *                 description: Transaction description
 *                 example: "Payment for supplies"
 *           example:
 *             debit_acc_id: "1"
 *             credit_acc_id: "2"
 *             amount: 5000
 *             transaction_date: "2024-01-15"
 *             description: "Payment for supplies"
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 transaction_id: "1"
 *               message: "Transaction created successfully"
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(req) {
  return transactionController.create(req);
}

/**
 * @swagger
 * /api/transaction:
 *   put:
 *     summary: Update an existing transaction
 *     description: Update transaction information in the system.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transaction_id
 *             properties:
 *               transaction_id:
 *                 type: string
 *                 description: Transaction ID
 *                 example: "1"
 *               debit_acc_id:
 *                 type: string
 *                 description: Debit account ID
 *                 example: "1"
 *               credit_acc_id:
 *                 type: string
 *                 description: Credit account ID
 *                 example: "2"
 *               amount:
 *                 type: number
 *                 description: Transaction amount
 *                 example: 6000
 *               transaction_date:
 *                 type: string
 *                 format: date
 *                 description: Transaction date
 *                 example: "2024-01-15"
 *               description:
 *                 type: string
 *                 description: Transaction description
 *                 example: "Updated payment for supplies"
 *           example:
 *             transaction_id: "1"
 *             debit_acc_id: "1"
 *             credit_acc_id: "2"
 *             amount: 6000
 *             transaction_date: "2024-01-15"
 *             description: "Updated payment for supplies"
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req) {
  return transactionController.update(req);
}
