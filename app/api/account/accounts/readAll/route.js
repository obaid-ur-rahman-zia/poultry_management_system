import accountsController from "@/app/controllers/account/accounts/accountsController";

/**
 * @swagger
 * /api/account/accounts/readAll:
 *   get:
 *     summary: Get all accounts
 *     description: Retrieve a list of all accounts in the chart of accounts with their head and subhead information.
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of accounts retrieved successfully
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
 *                       acc_id:
 *                         type: string
 *                         example: "1"
 *                       head_id:
 *                         type: string
 *                         example: "1"
 *                       sub_id:
 *                         type: string
 *                         example: "1"
 *                       account_nam:
 *                         type: string
 *                         example: "Cash Account"
 *                       status:
 *                         type: number
 *                         example: 1
 *                 message:
 *                   type: string
 *                   example: "Success"
 *             example:
 *               success: true
 *               data:
 *                 - acc_id: "1"
 *                   head_id: "1"
 *                   sub_id: "1"
 *                   account_nam: "Cash Account"
 *                   status: 1
 *               message: "Success"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(req) {
  return accountsController.readAll(req);
}
