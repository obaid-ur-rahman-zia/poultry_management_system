import transactionController from "@/app/controllers/transaction/transactionController";

/**
 * @swagger
 * /api/transaction/readAll:
 *   get:
 *     summary: Get all transactions
 *     description: Retrieve a list of all financial transactions in the system with account details.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       transaction_id:
 *                         type: string
 *                         example: "1"
 *                       debit_acc_id:
 *                         type: string
 *                         example: "1"
 *                       credit_acc_id:
 *                         type: string
 *                         example: "2"
 *                       amount:
 *                         type: number
 *                         example: 5000
 *                       transaction_date:
 *                         type: string
 *                         format: date
 *                         example: "2024-01-15"
 *                       description:
 *                         type: string
 *                         example: "Payment for supplies"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *             example:
 *               success: true
 *               data:
 *                 - transaction_id: "1"
 *                   debit_acc_id: "1"
 *                   credit_acc_id: "2"
 *                   amount: 5000
 *                   transaction_date: "2024-01-15"
 *                   description: "Payment for supplies"
 *               message: "Success"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET() {
    return transactionController.readAll()
}