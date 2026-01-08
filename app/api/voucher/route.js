import voucherController from "@/app/controllers/voucher/voucherController";

/**
 * @swagger
 * /api/voucher:
 *   post:
 *     summary: Create a new voucher
 *     description: Create a new accounting voucher in the system. Vouchers are used for recording financial transactions.
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - voucher_type
 *               - voucher_date
 *               - transactions
 *             properties:
 *               voucher_type:
 *                 type: string
 *                 description: Type of voucher (e.g., Payment, Receipt, Journal)
 *                 example: "Payment"
 *               voucher_date:
 *                 type: string
 *                 format: date
 *                 description: Voucher date
 *                 example: "2024-01-15"
 *               transactions:
 *                 type: array
 *                 description: Array of transactions in the voucher
 *                 items:
 *                   type: object
 *                   properties:
 *                     debit_acc_id:
 *                       type: string
 *                       example: "1"
 *                     credit_acc_id:
 *                       type: string
 *                       example: "2"
 *                     amount:
 *                       type: number
 *                       example: 5000
 *               description:
 *                 type: string
 *                 description: Voucher description
 *                 example: "Monthly payment voucher"
 *           example:
 *             voucher_type: "Payment"
 *             voucher_date: "2024-01-15"
 *             transactions:
 *               - debit_acc_id: "1"
 *                 credit_acc_id: "2"
 *                 amount: 5000
 *             description: "Monthly payment voucher"
 *     responses:
 *       201:
 *         description: Voucher created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 voucher_id: "1"
 *               message: "Voucher created successfully"
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(req) {
  return voucherController.create(req);
}

/**
 * @swagger
 * /api/voucher:
 *   put:
 *     summary: Update an existing voucher
 *     description: Update voucher information in the system.
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - voucher_id
 *             properties:
 *               voucher_id:
 *                 type: string
 *                 description: Voucher ID
 *                 example: "1"
 *               voucher_type:
 *                 type: string
 *                 description: Type of voucher
 *                 example: "Payment"
 *               voucher_date:
 *                 type: string
 *                 format: date
 *                 description: Voucher date
 *                 example: "2024-01-15"
 *               transactions:
 *                 type: array
 *                 description: Array of transactions
 *               description:
 *                 type: string
 *                 description: Voucher description
 *                 example: "Updated monthly payment voucher"
 *           example:
 *             voucher_id: "1"
 *             voucher_type: "Payment"
 *             voucher_date: "2024-01-15"
 *             description: "Updated monthly payment voucher"
 *     responses:
 *       200:
 *         description: Voucher updated successfully
 *       404:
 *         description: Voucher not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req) {
  return voucherController.update(req);
}

/**
 * @swagger
 * /api/voucher:
 *   delete:
 *     summary: Delete a voucher
 *     description: Delete a voucher from the system.
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - voucher_id
 *             properties:
 *               voucher_id:
 *                 type: string
 *                 description: Voucher ID to delete
 *                 example: "1"
 *           example:
 *             voucher_id: "1"
 *     responses:
 *       200:
 *         description: Voucher deleted successfully
 *       404:
 *         description: Voucher not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(req) {
  return voucherController.delete(req);
}
