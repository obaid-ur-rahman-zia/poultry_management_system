import WarehouseController from "@/app/controllers/warehouse/warehouseController";

/**
 * @swagger
 * /api/warehouse/readAll:
 *   get:
 *     summary: Get all warehouses
 *     description: Retrieve a list of all warehouses in the system.
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of warehouses retrieved successfully
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
 *                       warehouse_id:
 *                         type: string
 *                         example: "1"
 *                       warehouse_name:
 *                         type: string
 *                         example: "Main Warehouse"
 *                       warehouse_address:
 *                         type: string
 *                         example: "123 Storage Street"
 *                       status:
 *                         type: number
 *                         example: 1
 *                 message:
 *                   type: string
 *                   example: "Success"
 *             example:
 *               success: true
 *               data:
 *                 - warehouse_id: "1"
 *                   warehouse_name: "Main Warehouse"
 *                   warehouse_address: "123 Storage Street"
 *                   status: 1
 *               message: "Success"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  return WarehouseController.readAll();
}
