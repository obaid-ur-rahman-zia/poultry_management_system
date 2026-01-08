import WarehouseController from "@/app/controllers/warehouse/warehouseController";

/**
 * @swagger
 * /api/warehouse:
 *   post:
 *     summary: Create a new warehouse
 *     description: Create a new warehouse in the system for inventory management.
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - warehouse_name
 *             properties:
 *               warehouse_name:
 *                 type: string
 *                 description: Warehouse name
 *                 example: "Main Warehouse"
 *               warehouse_address:
 *                 type: string
 *                 description: Warehouse address
 *                 example: "123 Storage Street"
 *               status:
 *                 type: number
 *                 enum: [0, 1]
 *                 default: 1
 *                 description: Warehouse status
 *                 example: 1
 *           example:
 *             warehouse_name: "Main Warehouse"
 *             warehouse_address: "123 Storage Street"
 *             status: 1
 *     responses:
 *       201:
 *         description: Warehouse created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 warehouse_id: "1"
 *               message: "Warehouse created successfully"
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(req) {
  return WarehouseController.create(req);
}

/**
 * @swagger
 * /api/warehouse:
 *   put:
 *     summary: Update an existing warehouse
 *     description: Update warehouse information in the system.
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - warehouse_id
 *             properties:
 *               warehouse_id:
 *                 type: string
 *                 description: Warehouse ID
 *                 example: "1"
 *               warehouse_name:
 *                 type: string
 *                 description: Warehouse name
 *                 example: "Main Warehouse Updated"
 *               warehouse_address:
 *                 type: string
 *                 description: Warehouse address
 *                 example: "456 Updated Storage Street"
 *               status:
 *                 type: number
 *                 enum: [0, 1]
 *                 description: Warehouse status
 *                 example: 1
 *           example:
 *             warehouse_id: "1"
 *             warehouse_name: "Main Warehouse Updated"
 *             warehouse_address: "456 Updated Storage Street"
 *             status: 1
 *     responses:
 *       200:
 *         description: Warehouse updated successfully
 *       404:
 *         description: Warehouse not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req) {
  return WarehouseController.update(req);
}
