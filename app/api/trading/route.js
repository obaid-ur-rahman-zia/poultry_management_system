import TradingController from "@/app/controllers/trading/tradingController";

/**
 * @swagger
 * /api/trading:
 *   post:
 *     summary: Create a new trading entry
 *     description: Create a new trading transaction (buy/sell). Request body must be wrapped in req_object. Required fields include trading_date, buy_from_account, product_id, buy_price, buy_quantity, sale_to_account, sale_price, sale_quantity.
 *     tags: [Trading]
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
 *                 required: [trading_date, buy_from_account, product_id, buy_price, buy_quantity, sale_to_account, sale_price, sale_quantity]
 *                 properties:
 *                   trading_date:
 *                     type: string
 *                     format: date
 *                     description: Trading date
 *                   buy_from_account:
 *                     type: integer
 *                     description: Account ID (Former) for buy side
 *                   product_id:
 *                     type: integer
 *                     description: Product ID
 *                   product_nam:
 *                     type: string
 *                     description: Product name (for transaction detail)
 *                   buy_price:
 *                     type: number
 *                   buy_quantity:
 *                     type: number
 *                   buy_total:
 *                     type: number
 *                   sale_to_account:
 *                     type: integer
 *                     description: Account ID (Purcher) for sale side
 *                   sale_price:
 *                     type: number
 *                   sale_quantity:
 *                     type: number
 *                   sale_total:
 *                     type: number
 *                   buy_tax_type:
 *                     type: string
 *                     enum: [flat, percentage]
 *                   buy_tax_value:
 *                     type: number
 *                   buy_discount_type:
 *                     type: string
 *                     enum: [flat, percentage]
 *                   buy_discount_value:
 *                     type: number
 *                   sale_tax_type:
 *                     type: string
 *                     enum: [flat, percentage]
 *                   sale_tax_value:
 *                     type: number
 *                   sale_discount_type:
 *                     type: string
 *                     enum: [flat, percentage]
 *                   sale_discount_value:
 *                     type: number
 *                   do_number:
 *                     type: string
 *                   buy_detail:
 *                     type: string
 *                   sale_detail:
 *                     type: string
 *           example:
 *             req_object:
 *               trading_date: "2024-01-15"
 *               buy_from_account: 1
 *               product_id: 1
 *               product_nam: "Product A"
 *               buy_price: 100
 *               buy_quantity: 10
 *               buy_total: 1000
 *               sale_to_account: 2
 *               sale_price: 120
 *               sale_quantity: 10
 *               sale_total: 1200
 *     responses:
 *       201:
 *         description: Trading entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
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
 *     description: Update trading transaction. Request body must be wrapped in req_object. trading_id is required; other fields same as POST.
 *     tags: [Trading]
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
 *                 required: [trading_id]
 *                 properties:
 *                   trading_id:
 *                     type: integer
 *                     description: Trading ID to update
 *                   trading_date:
 *                     type: string
 *                     format: date
 *                   buy_from_account:
 *                     type: integer
 *                   product_id:
 *                     type: integer
 *                   product_nam:
 *                     type: string
 *                   buy_price:
 *                     type: number
 *                   buy_quantity:
 *                     type: number
 *                   buy_total:
 *                     type: number
 *                   sale_to_account:
 *                     type: integer
 *                   sale_price:
 *                     type: number
 *                   sale_quantity:
 *                     type: number
 *                   sale_total:
 *                     type: number
 *                   buy_tax_value:
 *                     type: number
 *                   buy_discount_value:
 *                     type: number
 *                   sale_tax_value:
 *                     type: number
 *                   sale_discount_value:
 *                     type: number
 *           example:
 *             req_object:
 *               trading_id: 1
 *               trading_date: "2024-01-15"
 *               buy_from_account: 1
 *               product_id: 1
 *               product_nam: "Product A"
 *               buy_price: 105
 *               buy_quantity: 10
 *               sale_to_account: 2
 *               sale_price: 125
 *               sale_quantity: 10
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

