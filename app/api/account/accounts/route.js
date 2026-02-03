import AccountsController from "@/app/controllers/account/accounts/accountsController";

/**
 * @swagger
 * /api/account/accounts:
 *   post:
 *     summary: Create a new account
 *     description: |
 *       Create a new account in the chart of accounts (same as Account create form in UI).
 *       Required: Account Type (head_id, sub_id), Name (account_nam).
 *       Optional: Contact numbers, Bank account numbers, Address, Account opening date, Opening balance with Credit/Debit type, Reference.
 *       Request body must be wrapped in req_object.
 *     tags: [Accounts]
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
 *                 required: [head_id, sub_id, account_nam]
 *                 properties:
 *                   head_id:
 *                     type: integer
 *                     description: Account head ID (from account head)
 *                     example: 1
 *                   sub_id:
 *                     type: integer
 *                     description: Account subhead ID - Account Type (e.g. Bank, Former, Purcher, Opening Balance)
 *                     example: 2
 *                   account_nam:
 *                     type: string
 *                     description: Account name (Name field)
 *                     example: "Cash Account"
 *                   account_contact:
 *                     type: string
 *                     description: Contact numbers - JSON array string e.g. "[\"03001234567\"]" or comma-separated
 *                     example: "[\"03001234567\", \"03211234567\"]"
 *                   account_no:
 *                     type: string
 *                     description: Bank account numbers - comma-separated or JSON array string
 *                     example: "1234567890, 0987654321"
 *                   account_address:
 *                     type: string
 *                     description: Address
 *                     example: "123 Main Street, City"
 *                   account_reference:
 *                     type: string
 *                     description: Reference or notes
 *                     example: ""
 *                   account_opening_date:
 *                     type: string
 *                     format: date
 *                     description: Account opening date (optional, for display/reference)
 *                     example: "2026-02-03"
 *                   opening_balance:
 *                     type: number
 *                     description: Opening balance amount (0 for none). Use with balance_type.
 *                     example: 0
 *                   balance_type:
 *                     type: string
 *                     enum: [credit, debit]
 *                     description: "Credit = opening_balance account debited, new account credited; Debit = opening_balance account credited, new account debited"
 *                     example: "credit"
 *                   account_cnic:
 *                     type: string
 *                     description: CNIC (optional)
 *                   account_alter_nam:
 *                     type: string
 *                     description: Alternate name (optional)
 *                   insert_by:
 *                     type: string
 *                     default: "user 1"
 *                   update_by:
 *                     type: string
 *                     default: "user 1"
 *                   status:
 *                     type: integer
 *                     enum: [0, 1]
 *                     default: 1
 *                     description: 1 = active, 0 = inactive
 *                     example: 1
 *           example:
 *             req_object:
 *               head_id: 1
 *               sub_id: 2
 *               account_nam: "New Former Account"
 *               account_contact: "[\"03001234567\"]"
 *               account_no: ""
 *               account_address: "123 Main Street"
 *               account_reference: ""
 *               account_opening_date: "2026-02-03"
 *               opening_balance: 0
 *               balance_type: "credit"
 *               status: 1
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
 *                 acc_id: 1
 *               message: "Account created successfully"
 *       400:
 *         description: Bad request - missing required fields or invalid head_id/sub_id
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
 *     description: Update account information in the system. Request body must be wrapped in req_object.
 *     tags: [Accounts]
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
 *                 required: [acc_id]
 *                 properties:
 *                   acc_id:
 *                     type: string
 *                     description: Account ID
 *                     example: "1"
 *                   head_id:
 *                     type: string
 *                     description: Account head ID
 *                     example: "1"
 *                   sub_id:
 *                     type: string
 *                     description: Account subhead ID
 *                     example: "1"
 *                   account_nam:
 *                     type: string
 *                     description: Account name
 *                     example: "Cash Account Updated"
 *                   status:
 *                     type: number
 *                     enum: [0, 1]
 *                     description: Account status
 *                     example: 1
 *           example:
 *             req_object:
 *               acc_id: "1"
 *               head_id: "1"
 *               sub_id: "1"
 *               account_nam: "Cash Account Updated"
 *               status: 1
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