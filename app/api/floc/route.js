import FlocController from "@/app/controllers/floc/flocController";

/**
 * @swagger
 * /api/floc:
 *   post:
 *     summary: Create a new floc
 *     description: Create a new floc (flock) in the system. A floc represents a group of birds in a farm.
 *     tags: [Flocs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - floc_name
 *               - farm_id
 *               - starting_date
 *             properties:
 *               floc_name:
 *                 type: string
 *                 description: Floc name
 *                 example: "Floc A"
 *               farm_id:
 *                 type: string
 *                 description: Farm ID where floc is located
 *                 example: "1"
 *               starting_date:
 *                 type: string
 *                 format: date
 *                 description: Starting date of the floc
 *                 example: "2024-01-01"
 *               ending_date:
 *                 type: string
 *                 format: date
 *                 description: Ending date of the floc (optional)
 *                 example: null
 *           example:
 *             floc_name: "Floc A"
 *             farm_id: "1"
 *             starting_date: "2024-01-01"
 *             ending_date: null
 *     responses:
 *       201:
 *         description: Floc created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 floc_id: "1"
 *               message: "Floc created successfully"
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(req) {
  return FlocController.create(req);
}

/**
 * @swagger
 * /api/floc:
 *   put:
 *     summary: Update an existing floc
 *     description: Update floc information in the system.
 *     tags: [Flocs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - floc_id
 *             properties:
 *               floc_id:
 *                 type: string
 *                 description: Floc ID
 *                 example: "1"
 *               floc_name:
 *                 type: string
 *                 description: Floc name
 *                 example: "Floc A Updated"
 *               farm_id:
 *                 type: string
 *                 description: Farm ID
 *                 example: "1"
 *               starting_date:
 *                 type: string
 *                 format: date
 *                 description: Starting date
 *                 example: "2024-01-01"
 *               ending_date:
 *                 type: string
 *                 format: date
 *                 description: Ending date
 *                 example: "2024-12-31"
 *           example:
 *             floc_id: "1"
 *             floc_name: "Floc A Updated"
 *             farm_id: "1"
 *             starting_date: "2024-01-01"
 *             ending_date: "2024-12-31"
 *     responses:
 *       200:
 *         description: Floc updated successfully
 *       404:
 *         description: Floc not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req) {
  return FlocController.update(req);
}

/**
 * @swagger
 * /api/floc:
 *   delete:
 *     summary: Delete a floc
 *     description: Delete a floc from the system.
 *     tags: [Flocs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - floc_id
 *             properties:
 *               floc_id:
 *                 type: string
 *                 description: Floc ID to delete
 *                 example: "1"
 *           example:
 *             floc_id: "1"
 *     responses:
 *       200:
 *         description: Floc deleted successfully
 *       404:
 *         description: Floc not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(req) {
  return FlocController.delete(req);
}

