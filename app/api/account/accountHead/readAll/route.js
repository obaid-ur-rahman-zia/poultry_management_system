import AccountHeadController from "@/app/controllers/account/accountHead/accountHeadController";

/**
 * @swagger
 * /api/account/accountHead/readAll:
 *   get:
 *     summary: Get all account heads
 *     description: Retrieve a list of all account heads in the chart of accounts.
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of account heads retrieved successfully
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
 *                       head_id:
 *                         type: string
 *                         example: "1"
 *                       head_nam:
 *                         type: string
 *                         example: "Assets"
 *                       status:
 *                         type: number
 *                         example: 1
 *                 message:
 *                   type: string
 *                   example: "Success"
 *             example:
 *               success: true
 *               data:
 *                 - head_id: "1"
 *                   head_nam: "Assets"
 *                   status: 1
 *                 - head_id: "2"
 *                   head_nam: "Liabilities"
 *                   status: 1
 *               message: "Success"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  return AccountHeadController.readAll();
}
