import SaleController from "@/app/controllers/sale/saleController";

/**
 * @swagger
 * /api/sale/readAll:
 *   get:
 *     summary: Get all sales
 *     description: Retrieve a list of all sales transactions in the system with customer and product details.
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sales retrieved successfully
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
 *                     $ref: '#/components/schemas/Sale'
 *                 message:
 *                   type: string
 *                   example: "Success"
 *             example:
 *               success: true
 *               data:
 *                 - sale_id: "1"
 *                   sale_date: "2024-01-15"
 *                   customer_id: "1"
 *                   total_amount: 50000
 *               message: "Success"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  return SaleController.readAll();
}
