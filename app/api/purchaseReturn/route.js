import purchaseReturnController from "@/app/controllers/purchaseReturn/purchaseReturnController";

/**
 * @swagger
 * /api/purchaseReturn:
 *   post:
 *     summary: Create a new purchase return
 *     description: Create a new purchase return entry when goods are returned to suppliers.
 *     tags: [Purchase Returns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - purchase_id
 *               - return_date
 *               - items
 *             properties:
 *               purchase_id:
 *                 type: string
 *                 description: Original purchase ID
 *                 example: "1"
 *               supplier_id:
 *                 type: string
 *                 description: Supplier ID
 *                 example: "1"
 *               return_date:
 *                 type: string
 *                 format: date
 *                 description: Return date
 *                 example: "2024-01-15"
 *               items:
 *                 type: array
 *                 description: Array of returned items
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: string
 *                       example: "1"
 *                     quantity:
 *                       type: number
 *                       example: 5
 *                     return_reason:
 *                       type: string
 *                       example: "Defective goods"
 *               description:
 *                 type: string
 *                 description: Return description
 *                 example: "Return of defective products"
 *           example:
 *             purchase_id: "1"
 *             supplier_id: "1"
 *             return_date: "2024-01-15"
 *             items:
 *               - product_id: "1"
 *                 quantity: 5
 *                 return_reason: "Defective goods"
 *             description: "Return of defective products"
 *     responses:
 *       201:
 *         description: Purchase return created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 return_id: "1"
 *               message: "Purchase return created successfully"
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(req) {
  return await purchaseReturnController.create(req);
}

/**
 * @swagger
 * /api/purchaseReturn:
 *   put:
 *     summary: Update an existing purchase return
 *     description: Update purchase return information in the system.
 *     tags: [Purchase Returns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - return_id
 *             properties:
 *               return_id:
 *                 type: string
 *                 description: Purchase return ID
 *                 example: "1"
 *               return_date:
 *                 type: string
 *                 format: date
 *                 description: Return date
 *                 example: "2024-01-15"
 *               items:
 *                 type: array
 *                 description: Array of returned items
 *               description:
 *                 type: string
 *                 description: Return description
 *                 example: "Updated return of defective products"
 *           example:
 *             return_id: "1"
 *             return_date: "2024-01-15"
 *             description: "Updated return of defective products"
 *     responses:
 *       200:
 *         description: Purchase return updated successfully
 *       404:
 *         description: Purchase return not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req) {
  return await purchaseReturnController.update(req);
}
