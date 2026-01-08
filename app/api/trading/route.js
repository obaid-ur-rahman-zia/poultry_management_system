import TradingController from "@/app/controllers/trading/tradingController";

/**
 * @swagger
 * /api/trading:
 *   post:
 *     summary: Create a new trading entry
 *     description: Create a new trading transaction in the system for buy/sell operations.
 *     tags: [Trading]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trading_type
 *               - trading_date
 *               - amount
 *             properties:
 *               trading_type:
 *                 type: string
 *                 enum: [Buy, Sell]
 *                 description: Type of trading (Buy or Sell)
 *                 example: "Buy"
 *               trading_date:
 *                 type: string
 *                 format: date
 *                 description: Trading date
 *                 example: "2024-01-15"
 *               amount:
 *                 type: number
 *                 description: Trading amount
 *                 example: 10000
 *               description:
 *                 type: string
 *                 description: Trading description
 *                 example: "Purchase of poultry feed"
 *           example:
 *             trading_type: "Buy"
 *             trading_date: "2024-01-15"
 *             amount: 10000
 *             description: "Purchase of poultry feed"
 *     responses:
 *       201:
 *         description: Trading entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 trading_id: "1"
 *               message: "Trading entry created successfully"
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(req) {
  return TradingController.create(req);
}

/**
 * @swagger
 * /api/trading:
 *   put:
 *     summary: Update an existing trading entry
 *     description: Update trading transaction information in the system.
 *     tags: [Trading]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trading_id
 *             properties:
 *               trading_id:
 *                 type: string
 *                 description: Trading ID
 *                 example: "1"
 *               trading_type:
 *                 type: string
 *                 enum: [Buy, Sell]
 *                 description: Type of trading
 *                 example: "Sell"
 *               trading_date:
 *                 type: string
 *                 format: date
 *                 description: Trading date
 *                 example: "2024-01-15"
 *               amount:
 *                 type: number
 *                 description: Trading amount
 *                 example: 12000
 *               description:
 *                 type: string
 *                 description: Trading description
 *                 example: "Updated purchase of poultry feed"
 *           example:
 *             trading_id: "1"
 *             trading_type: "Sell"
 *             trading_date: "2024-01-15"
 *             amount: 12000
 *             description: "Updated purchase of poultry feed"
 *     responses:
 *       200:
 *         description: Trading entry updated successfully
 *       404:
 *         description: Trading entry not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req) {
  return TradingController.update(req);
}

/**
 * @swagger
 * /api/trading:
 *   delete:
 *     summary: Delete a trading entry
 *     description: Delete a trading transaction from the system.
 *     tags: [Trading]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trading_id
 *             properties:
 *               trading_id:
 *                 type: string
 *                 description: Trading ID to delete
 *                 example: "1"
 *           example:
 *             trading_id: "1"
 *     responses:
 *       200:
 *         description: Trading entry deleted successfully
 *       404:
 *         description: Trading entry not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(req) {
  return TradingController.delete(req);
}

