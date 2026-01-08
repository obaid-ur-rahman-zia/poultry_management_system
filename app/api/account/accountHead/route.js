import AccountHeadController from "@/app/controllers/account/accountHead/accountHeadController";

/**
 * @swagger
 * /api/account/accountHead:
 *   post:
 *     summary: Create a new account head
 *     description: Create a new account head in the chart of accounts. Account heads are the main categories in the accounting system.
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - head_nam
 *             properties:
 *               head_nam:
 *                 type: string
 *                 description: Account head name
 *                 example: "Assets"
 *               status:
 *                 type: number
 *                 enum: [0, 1]
 *                 default: 1
 *                 description: Account head status (1 = active, 0 = inactive)
 *                 example: 1
 *           example:
 *             head_nam: "Assets"
 *             status: 1
 *     responses:
 *       201:
 *         description: Account head created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 head_id: "1"
 *               message: "Account head created successfully"
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(req) {
  return AccountHeadController.create(req);
}

/**
 * @swagger
 * /api/account/accountHead:
 *   put:
 *     summary: Update an existing account head
 *     description: Update account head information in the system.
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - head_id
 *             properties:
 *               head_id:
 *                 type: string
 *                 description: Account head ID
 *                 example: "1"
 *               head_nam:
 *                 type: string
 *                 description: Account head name
 *                 example: "Assets Updated"
 *               status:
 *                 type: number
 *                 enum: [0, 1]
 *                 description: Account head status
 *                 example: 1
 *           example:
 *             head_id: "1"
 *             head_nam: "Assets Updated"
 *             status: 1
 *     responses:
 *       200:
 *         description: Account head updated successfully
 *       404:
 *         description: Account head not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req) {
  return AccountHeadController.update(req);
}
