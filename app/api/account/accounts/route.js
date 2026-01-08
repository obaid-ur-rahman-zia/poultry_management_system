import AccountsController from "@/app/controllers/account/accounts/accountsController";

/**
 * @swagger
 * /api/account/accounts:
 *   post:
 *     summary: Create a new account
 *     description: Create a new account in the chart of accounts. Accounts are the detailed entries under account subheads.
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - head_id
 *               - sub_id
 *               - account_nam
 *             properties:
 *               head_id:
 *                 type: string
 *                 description: Account head ID
 *                 example: "1"
 *               sub_id:
 *                 type: string
 *                 description: Account subhead ID
 *                 example: "1"
 *               account_nam:
 *                 type: string
 *                 description: Account name
 *                 example: "Cash Account"
 *               account_address:
 *                 type: string
 *                 description: Account address (if applicable)
 *                 example: ""
 *               account_contact:
 *                 type: string
 *                 description: Account contact (if applicable)
 *                 example: ""
 *               status:
 *                 type: number
 *                 enum: [0, 1]
 *                 default: 1
 *                 description: Account status
 *                 example: 1
 *           example:
 *             head_id: "1"
 *             sub_id: "1"
 *             account_nam: "Cash Account"
 *             status: 1
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 acc_id: "1"
 *               message: "Account created successfully"
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(req) {
  return AccountsController.create(req);
}

/**
 * @swagger
 * /api/account/accounts:
 *   put:
 *     summary: Update an existing account
 *     description: Update account information in the system.
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - acc_id
 *             properties:
 *               acc_id:
 *                 type: string
 *                 description: Account ID
 *                 example: "1"
 *               head_id:
 *                 type: string
 *                 description: Account head ID
 *                 example: "1"
 *               sub_id:
 *                 type: string
 *                 description: Account subhead ID
 *                 example: "1"
 *               account_nam:
 *                 type: string
 *                 description: Account name
 *                 example: "Cash Account Updated"
 *               status:
 *                 type: number
 *                 enum: [0, 1]
 *                 description: Account status
 *                 example: 1
 *           example:
 *             acc_id: "1"
 *             head_id: "1"
 *             sub_id: "1"
 *             account_nam: "Cash Account Updated"
 *             status: 1
 *     responses:
 *       200:
 *         description: Account updated successfully
 *       404:
 *         description: Account not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req) {
  return AccountsController.update(req);
}

/**
 * @swagger
 * /api/account/accounts:
 *   delete:
 *     summary: Delete an account
 *     description: Delete an account from the system. Note: Accounts with transactions cannot be deleted.
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - acc_id
 *             properties:
 *               acc_id:
 *                 type: string
 *                 description: Account ID to delete
 *                 example: "1"
 *           example:
 *             acc_id: "1"
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       400:
 *         description: Bad request - Account has transactions
 *       404:
 *         description: Account not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(req) {
  return AccountsController.delete(req);
}