import SupplierController from "@/app/controllers/supplier/supplierController";

/**
 * @swagger
 * /api/supplier/readById:
 *   get:
 *     summary: Get supplier by ID
 *     description: Retrieve a specific supplier by their account ID.
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: acc_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier account ID
 *         example: "1"
 *     responses:
 *       200:
 *         description: Supplier retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Supplier'
 *                 message:
 *                   type: string
 *                   example: "Success"
 *             example:
 *               success: true
 *               data:
 *                 acc_id: "1"
 *                 supplier_name: "ABC Suppliers Ltd"
 *                 supplier_address: "456 Business Avenue"
 *                 supplier_contact: "+923001234568"
 *               message: "Success"
 *       400:
 *         description: Bad request - acc_id parameter is required
 *       404:
 *         description: Supplier not found
 *       500:
 *         description: Internal server error
 */
export async function GET(req) {
  return SupplierController.readById(req);
}
