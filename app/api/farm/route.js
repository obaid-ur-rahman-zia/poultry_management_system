import FarmController from "@/app/controllers/farm/farmController";

/**
 * @swagger
 * /api/farm:
 *   post:
 *     summary: Create a new farm
 *     description: Create a new farm in the system for managing poultry operations.
 *     tags: [Farms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - farm_name
 *             properties:
 *               farm_name:
 *                 type: string
 *                 description: Farm name
 *                 example: "Main Farm"
 *               farm_address:
 *                 type: string
 *                 description: Farm address
 *                 example: "789 Farm Road, City"
 *               status:
 *                 type: number
 *                 enum: [0, 1]
 *                 default: 1
 *                 description: Farm status (1 = active, 0 = inactive)
 *                 example: 1
 *           example:
 *             farm_name: "Main Farm"
 *             farm_address: "789 Farm Road, City"
 *             status: 1
 *     responses:
 *       201:
 *         description: Farm created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 farm_id: "1"
 *               message: "Farm created successfully"
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(req) {
  return FarmController.create(req);
}

/**
 * @swagger
 * /api/farm:
 *   put:
 *     summary: Update an existing farm
 *     description: Update farm information in the system.
 *     tags: [Farms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - farm_id
 *             properties:
 *               farm_id:
 *                 type: string
 *                 description: Farm ID
 *                 example: "1"
 *               farm_name:
 *                 type: string
 *                 description: Farm name
 *                 example: "Main Farm Updated"
 *               farm_address:
 *                 type: string
 *                 description: Farm address
 *                 example: "789 Updated Farm Road"
 *               status:
 *                 type: number
 *                 enum: [0, 1]
 *                 description: Farm status
 *                 example: 1
 *           example:
 *             farm_id: "1"
 *             farm_name: "Main Farm Updated"
 *             farm_address: "789 Updated Farm Road"
 *             status: 1
 *     responses:
 *       200:
 *         description: Farm updated successfully
 *       404:
 *         description: Farm not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req) {
  return FarmController.update(req);
}

/**
 * @swagger
 * /api/farm:
 *   delete:
 *     summary: Delete a farm
 *     description: Delete a farm from the system. This will also delete associated flocs.
 *     tags: [Farms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - farm_id
 *             properties:
 *               farm_id:
 *                 type: string
 *                 description: Farm ID to delete
 *                 example: "1"
 *           example:
 *             farm_id: "1"
 *     responses:
 *       200:
 *         description: Farm deleted successfully
 *       404:
 *         description: Farm not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(req) {
  return FarmController.delete(req);
}

