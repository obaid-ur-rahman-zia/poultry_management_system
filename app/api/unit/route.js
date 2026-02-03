import UnitController from "@/app/controllers/unit/unitController";

/**
 * @swagger
 * /api/unit:
 *   post:
 *     summary: Create a new unit
 *     description: Create a new unit in the system. Request body must be wrapped in req_object. Units are used for farms/operations (e.g., capacity, address).
 *     tags: [Units]
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
 *                 required: [prounit_nam]
 *                 properties:
 *                   prounit_nam:
 *                     type: string
 *                     description: Unit name
 *                     example: "Farm Unit A"
 *                   capacity:
 *                     type: string
 *                     description: Unit capacity (optional)
 *                     example: "10000"
 *                   address:
 *                     type: string
 *                     description: Unit address (optional)
 *                     example: "123 Farm Road"
 *           example:
 *             req_object:
 *               prounit_nam: "Farm Unit A"
 *               capacity: "10000"
 *               address: "123 Farm Road"
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
 *                 prounit_id: 1
 *               message: "Unit and account created successfully"
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
 *     description: Update unit information in the system. Request body must be wrapped in req_object.
 *     tags: [Units]
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
 *                 required: [prounit_id, prounit_nam]
 *                 properties:
 *                   prounit_id:
 *                     type: integer
 *                     description: Unit ID to update
 *                     example: 1
 *                   prounit_nam:
 *                     type: string
 *                     description: Unit name
 *                     example: "Farm Unit A Updated"
 *                   capacity:
 *                     type: string
 *                     description: Unit capacity
 *                   address:
 *                     type: string
 *                     description: Unit address
 *           example:
 *             req_object:
 *               prounit_id: 1
 *               prounit_nam: "Farm Unit A Updated"
 *               capacity: "12000"
 *               address: "456 New Road"
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
