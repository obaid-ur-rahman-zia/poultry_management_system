import TradingController from "@/app/controllers/trading/tradingController";

/**
 * @swagger
 * /api/trading/readAll:
 *   get:
 *     summary: Get all trading entries
 *     description: Retrieve a list of all trading transactions in the system.
 *     tags: [Trading]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of trading entries retrieved successfully
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
 *                       trading_id:
 *                         type: string
 *                         example: "1"
 *                       trading_type:
 *                         type: string
 *                         example: "Buy"
 *                       trading_date:
 *                         type: string
 *                         format: date
 *                         example: "2024-01-15"
 *                       amount:
 *                         type: number
 *                         example: 10000
 *                       description:
 *                         type: string
 *                         example: "Purchase of poultry feed"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *             example:
 *               success: true
 *               data:
 *                 - trading_id: "1"
 *                   trading_type: "Buy"
 *                   trading_date: "2024-01-15"
 *                   amount: 10000
 *                   description: "Purchase of poultry feed"
 *               message: "Success"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(req) {
  return TradingController.readAll();
}

