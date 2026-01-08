import SupplierController from "@/app/controllers/supplier/supplierController";

/**
 * @swagger
 * /api/supplier/readAll:
 *   get:
 *     summary: Get all suppliers
 *     description: Retrieve a list of all suppliers in the system along with the next available supplier ID.
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of suppliers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     supplier_data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Supplier'
 *                     nextId:
 *                       type: string
 *                       example: "2"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *             example:
 *               success: true
 *               data:
 *                 supplier_data:
 *                   - acc_id: "1"
 *                     supplier_name: "ABC Suppliers Ltd"
 *                     supplier_address: "456 Business Avenue"
 *                     supplier_contact: "+923001234568"
 *                 nextId: "2"
 *               message: "Success"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  return SupplierController.readAll();
}
