import UnitSaleController from "@/app/controllers/unitSale/unitSaleController";

/**
 * @swagger
 * /api/unitSale:
 *   post:
 *     summary: Create a new unit sale
 *     description: Create a new sale entry for a specific unit (farm/floc). Unit sales track sales from individual units.
 *     tags: [Unit Sales]
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
 *                 required: [unit_id, sale_date, amount]
 *                 properties:
 *                   unit_id:
 *                     type: string
 *                     description: Unit ID (prounit_id or farm_id)
 *                     example: "1"
 *                   sale_date:
 *                     type: string
 *                     format: date
 *                     description: Sale date
 *                     example: "2024-01-15"
 *                   amount:
 *                     type: number
 *                     description: Sale amount
 *                     example: 50000
 *                   quantity:
 *                     type: number
 *                     description: Quantity sold
 *                     example: 100
 *                   description:
 *                     type: string
 *                     description: Sale description
 *                     example: "Sale of poultry products"
 *           example:
 *             req_object:
 *               unit_id: "1"
 *               sale_date: "2024-01-15"
 *               amount: 50000
 *               quantity: 100
 *               description: "Sale of poultry products"
 *     responses:
 *       201:
 *         description: Unit sale created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 unit_sale_id: "1"
 *               message: "Unit sale created successfully"
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(req) {
  return UnitSaleController.create(req);
}

/**
 * @swagger
 * /api/unitSale:
 *   put:
 *     summary: Update an existing unit sale
 *     description: Update unit sale information in the system.
 *     tags: [Unit Sales]
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
 *                 required: [unit_sale_id]
 *                 properties:
 *                   unit_sale_id:
 *                     type: string
 *                     description: Unit sale ID to update
 *                     example: "1"
 *                   unit_id:
 *                     type: string
 *                     description: Unit ID
 *                     example: "1"
 *                   sale_date:
 *                     type: string
 *                     format: date
 *                     description: Sale date
 *                     example: "2024-01-15"
 *                   amount:
 *                     type: number
 *                     description: Sale amount
 *                     example: 55000
 *                   quantity:
 *                     type: number
 *                     description: Quantity sold
 *                     example: 110
 *                   description:
 *                     type: string
 *                     description: Sale description
 *                     example: "Updated sale of poultry products"
 *           example:
 *             req_object:
 *               unit_sale_id: "1"
 *               unit_id: "1"
 *               sale_date: "2024-01-15"
 *               amount: 55000
 *               quantity: 110
 *               description: "Updated sale of poultry products"
 *     responses:
 *       200:
 *         description: Unit sale updated successfully
 *       404:
 *         description: Unit sale not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req) {
  return UnitSaleController.update(req);
}

/**
 * @swagger
 * /api/unitSale:
 *   delete:
 *     summary: Delete a unit sale
 *     description: Delete a unit sale entry from the system.
 *     tags: [Unit Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - unit_sale_id
 *             properties:
 *               unit_sale_id:
 *                 type: string
 *                 description: Unit sale ID to delete
 *                 example: "1"
 *           example:
 *             unit_sale_id: "1"
 *     responses:
 *       200:
 *         description: Unit sale deleted successfully
 *       404:
 *         description: Unit sale not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(req) {
  return UnitSaleController.delete(req);
}

