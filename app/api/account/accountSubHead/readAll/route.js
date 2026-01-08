import AccountSubHeadController from "@/app/controllers/account/accountSubHead/accountSubHeadController";

/**
 * @swagger
 * /api/account/accountSubHead/readAll:
 *   get:
 *     summary: Get all account subheads
 *     description: Retrieve a list of all account subheads with their parent account heads.
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of account subheads retrieved successfully
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
 *                       sub_id:
 *                         type: string
 *                         example: "1"
 *                       head_id:
 *                         type: string
 *                         example: "1"
 *                       subhead_nam:
 *                         type: string
 *                         example: "Current Assets"
 *                       status:
 *                         type: number
 *                         example: 1
 *                 message:
 *                   type: string
 *                   example: "Success"
 *             example:
 *               success: true
 *               data:
 *                 - sub_id: "1"
 *                   head_id: "1"
 *                   subhead_nam: "Current Assets"
 *                   status: 1
 *               message: "Success"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  return AccountSubHeadController.readAll();
}
