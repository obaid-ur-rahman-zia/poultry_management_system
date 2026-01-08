import UnitController from "@/app/controllers/unit/unitController";

/**
 * @swagger
 * /api/unit:
 *   post:
 *     summary: Create a new unit
 *     description: Create a new unit in the system. Units are used for measurement (e.g., kg, pieces, boxes).
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - unit_name
 *             properties:
 *               unit_name:
 *                 type: string
 *                 description: Unit name
 *                 example: "Kilogram"
 *               unit_short_name:
 *                 type: string
 *                 description: Unit short name or abbreviation
 *                 example: "kg"
 *               status:
 *                 type: number
 *                 enum: [0, 1]
 *                 default: 1
 *                 description: Unit status
 *                 example: 1
 *           example:
 *             unit_name: "Kilogram"
 *             unit_short_name: "kg"
 *             status: 1
 *     responses:
 *       201:
 *         description: Unit created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 unit_id: "1"
 *               message: "Unit created successfully"
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(req) {
  return UnitController.create(req);
}

/**
 * @swagger
 * /api/unit:
 *   put:
 *     summary: Update an existing unit
 *     description: Update unit information in the system.
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - unit_id
 *             properties:
 *               unit_id:
 *                 type: string
 *                 description: Unit ID
 *                 example: "1"
 *               unit_name:
 *                 type: string
 *                 description: Unit name
 *                 example: "Kilogram Updated"
 *               unit_short_name:
 *                 type: string
 *                 description: Unit short name
 *                 example: "kg"
 *               status:
 *                 type: number
 *                 enum: [0, 1]
 *                 description: Unit status
 *                 example: 1
 *           example:
 *             unit_id: "1"
 *             unit_name: "Kilogram Updated"
 *             unit_short_name: "kg"
 *             status: 1
 *     responses:
 *       200:
 *         description: Unit updated successfully
 *       404:
 *         description: Unit not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req) {
  return UnitController.update(req);
}
