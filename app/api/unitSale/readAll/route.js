import UnitSaleController from "@/app/controllers/unitSale/unitSaleController";

/**
 * @swagger
 * /api/unitSale/readAll:
 *   get:
 *     summary: Get all unit sales
 *     description: Retrieve a list of all unit sales in the system with unit and sale details.
 *     tags: [Unit Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of unit sales retrieved successfully
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
 *                       unit_sale_id:
 *                         type: string
 *                         example: "1"
 *                       unit_id:
 *                         type: string
 *                         example: "1"
 *                       sale_date:
 *                         type: string
 *                         format: date
 *                         example: "2024-01-15"
 *                       amount:
 *                         type: number
 *                         example: 50000
 *                       quantity:
 *                         type: number
 *                         example: 100
 *                 message:
 *                   type: string
 *                   example: "Success"
 *             example:
 *               success: true
 *               data:
 *                 - unit_sale_id: "1"
 *                   unit_id: "1"
 *                   sale_date: "2024-01-15"
 *                   amount: 50000
 *                   quantity: 100
 *               message: "Success"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(req) {
  return UnitSaleController.readAll(req);
}

