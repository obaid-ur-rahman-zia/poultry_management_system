import SupplierController from "@/app/controllers/supplier/supplierController";

/**
 * @swagger
 * /api/supplier:
 *   post:
 *     summary: Create a new supplier
 *     description: Create a new supplier in the system. This will also create an account entry for the supplier.
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - supplier_name
 *               - supplier_address
 *               - supplier_contact
 *             properties:
 *               supplier_name:
 *                 type: string
 *                 description: Supplier name
 *                 example: "ABC Suppliers Ltd"
 *               supplier_address:
 *                 type: string
 *                 description: Supplier address
 *                 example: "456 Business Avenue, City"
 *               supplier_contact:
 *                 type: string
 *                 description: Supplier contact number
 *                 example: "+923001234568"
 *               supplier_cnic:
 *                 type: string
 *                 description: Supplier CNIC number
 *                 example: "12345-1234567-2"
 *           example:
 *             supplier_name: "ABC Suppliers Ltd"
 *             supplier_address: "456 Business Avenue, City"
 *             supplier_contact: "+923001234568"
 *             supplier_cnic: "12345-1234567-2"
 *     responses:
 *       201:
 *         description: Supplier created successfully
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
 *                     acc_id:
 *                       type: string
 *                       example: "1"
 *                 message:
 *                   type: string
 *                   example: "Supplier created successfully"
 *             example:
 *               success: true
 *               data:
 *                 acc_id: "1"
 *               message: "Supplier created successfully"
 *       400:
 *         description: Bad request - Invalid input data
 *       500:
 *         description: Internal server error
 */
export async function POST(req) {
  return SupplierController.create(req);
}

/**
 * @swagger
 * /api/supplier:
 *   put:
 *     summary: Update an existing supplier
 *     description: Update supplier information in the system.
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - acc_id
 *             properties:
 *               acc_id:
 *                 type: string
 *                 description: Supplier account ID
 *                 example: "1"
 *               supplier_name:
 *                 type: string
 *                 description: Supplier name
 *                 example: "ABC Suppliers Ltd Updated"
 *               supplier_address:
 *                 type: string
 *                 description: Supplier address
 *                 example: "789 Updated Avenue"
 *               supplier_contact:
 *                 type: string
 *                 description: Supplier contact number
 *                 example: "+923001234568"
 *           example:
 *             acc_id: "1"
 *             supplier_name: "ABC Suppliers Ltd Updated"
 *             supplier_address: "789 Updated Avenue"
 *             supplier_contact: "+923001234568"
 *     responses:
 *       200:
 *         description: Supplier updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Supplier not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req) {
  return SupplierController.update(req);
}
