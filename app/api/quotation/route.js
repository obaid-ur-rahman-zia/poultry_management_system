import QuotationController from "@/app/controllers/quotation/quotationController";

/**
 * @swagger
 * /api/quotation:
 *   post:
 *     summary: Create a new quotation
 *     description: Create a new quotation/quote for customers. Quotations are preliminary sales documents.
 *     tags: [Quotations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *               - quotation_date
 *               - items
 *             properties:
 *               customer_id:
 *                 type: string
 *                 description: Customer ID
 *                 example: "1"
 *               quotation_date:
 *                 type: string
 *                 format: date
 *                 description: Quotation date
 *                 example: "2024-01-15"
 *               items:
 *                 type: array
 *                 description: Array of quotation items
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: string
 *                       example: "1"
 *                     quantity:
 *                       type: number
 *                       example: 10
 *                     unit_price:
 *                       type: number
 *                       example: 500
 *               valid_until:
 *                 type: string
 *                 format: date
 *                 description: Quotation validity date
 *                 example: "2024-02-15"
 *           example:
 *             customer_id: "1"
 *             quotation_date: "2024-01-15"
 *             items:
 *               - product_id: "1"
 *                 quantity: 10
 *                 unit_price: 500
 *             valid_until: "2024-02-15"
 *     responses:
 *       201:
 *         description: Quotation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 quotation_id: "1"
 *               message: "Quotation created successfully"
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(req) {
  return QuotationController.create(req);
}

/**
 * @swagger
 * /api/quotation:
 *   put:
 *     summary: Update an existing quotation
 *     description: Update quotation information in the system.
 *     tags: [Quotations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quotation_id
 *             properties:
 *               quotation_id:
 *                 type: string
 *                 description: Quotation ID
 *                 example: "1"
 *               customer_id:
 *                 type: string
 *                 description: Customer ID
 *                 example: "1"
 *               quotation_date:
 *                 type: string
 *                 format: date
 *                 description: Quotation date
 *                 example: "2024-01-15"
 *               items:
 *                 type: array
 *                 description: Array of quotation items
 *               valid_until:
 *                 type: string
 *                 format: date
 *                 description: Quotation validity date
 *                 example: "2024-02-15"
 *           example:
 *             quotation_id: "1"
 *             customer_id: "1"
 *             quotation_date: "2024-01-15"
 *             valid_until: "2024-02-15"
 *     responses:
 *       200:
 *         description: Quotation updated successfully
 *       404:
 *         description: Quotation not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req) {
  return QuotationController.update(req);
}
