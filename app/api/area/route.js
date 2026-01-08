import areaController from "@/app/controllers/area/areaController";

/**
 * @swagger
 * /api/area:
 *   post:
 *     summary: Create a new area
 *     description: Create a new area in the system. Areas are used for organizing employees and operations geographically.
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - area_name
 *             properties:
 *               area_name:
 *                 type: string
 *                 description: Area name
 *                 example: "North Zone"
 *               status:
 *                 type: number
 *                 enum: [0, 1]
 *                 default: 1
 *                 description: Area status
 *                 example: 1
 *           example:
 *             area_name: "North Zone"
 *             status: 1
 *     responses:
 *       201:
 *         description: Area created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 area_id: "1"
 *               message: "Area created successfully"
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(req) {
  return areaController.create(req);
}

/**
 * @swagger
 * /api/area:
 *   put:
 *     summary: Update an existing area
 *     description: Update area information in the system.
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - area_id
 *             properties:
 *               area_id:
 *                 type: string
 *                 description: Area ID
 *                 example: "1"
 *               area_name:
 *                 type: string
 *                 description: Area name
 *                 example: "North Zone Updated"
 *               status:
 *                 type: number
 *                 enum: [0, 1]
 *                 description: Area status
 *                 example: 1
 *           example:
 *             area_id: "1"
 *             area_name: "North Zone Updated"
 *             status: 1
 *     responses:
 *       200:
 *         description: Area updated successfully
 *       404:
 *         description: Area not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req) {
  return areaController.update(req);
}
