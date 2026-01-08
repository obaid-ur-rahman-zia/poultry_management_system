import AccountSubHeadController from "@/app/controllers/account/accountSubHead/accountSubHeadController";

/**
 * @swagger
 * /api/account/accountSubHead:
 *   post:
 *     summary: Create a new account subhead
 *     description: Create a new account subhead under an account head. Subheads provide more detailed categorization.
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
 *               - subhead_nam
 *             properties:
 *               head_id:
 *                 type: string
 *                 description: Parent account head ID
 *                 example: "1"
 *               subhead_nam:
 *                 type: string
 *                 description: Account subhead name
 *                 example: "Current Assets"
 *               status:
 *                 type: number
 *                 enum: [0, 1]
 *                 default: 1
 *                 description: Account subhead status
 *                 example: 1
 *           example:
 *             head_id: "1"
 *             subhead_nam: "Current Assets"
 *             status: 1
 *     responses:
 *       201:
 *         description: Account subhead created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 sub_id: "1"
 *               message: "Account subhead created successfully"
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(req) {
  return AccountSubHeadController.create(req);
}

/**
 * @swagger
 * /api/account/accountSubHead:
 *   put:
 *     summary: Update an existing account subhead
 *     description: Update account subhead information in the system.
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
 *               - sub_id
 *             properties:
 *               sub_id:
 *                 type: string
 *                 description: Account subhead ID
 *                 example: "1"
 *               head_id:
 *                 type: string
 *                 description: Parent account head ID
 *                 example: "1"
 *               subhead_nam:
 *                 type: string
 *                 description: Account subhead name
 *                 example: "Current Assets Updated"
 *               status:
 *                 type: number
 *                 enum: [0, 1]
 *                 description: Account subhead status
 *                 example: 1
 *           example:
 *             sub_id: "1"
 *             head_id: "1"
 *             subhead_nam: "Current Assets Updated"
 *             status: 1
 *     responses:
 *       200:
 *         description: Account subhead updated successfully
 *       404:
 *         description: Account subhead not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req) {
  return AccountSubHeadController.update(req);
}
