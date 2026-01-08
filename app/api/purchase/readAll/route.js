import PurchaseController from "@/app/controllers/purchase/purchaseController";

/**
 * @swagger
 * /api/purchase/readAll:
 *   get:
 *     summary: Get all purchases
 *     description: Retrieve a list of all purchase transactions in the system with supplier and product details.
 *     tags: [Purchases]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of purchases retrieved successfully
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
 *                     $ref: '#/components/schemas/Purchase'
 *                 message:
 *                   type: string
 *                   example: "Success"
 *             example:
 *               success: true
 *               data:
 *                 - purchase_id: "1"
 *                   purchase_date: "2024-01-15"
 *                   supplier_id: "1"
 *                   total_amount: 30000
 *               message: "Success"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  return PurchaseController.readAll();
}
