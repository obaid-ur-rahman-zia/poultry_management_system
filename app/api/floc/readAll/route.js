import FlocController from "@/app/controllers/floc/flocController";

/**
 * @swagger
 * /api/floc/readAll:
 *   get:
 *     summary: Get all flocs
 *     description: Retrieve a list of all flocs in the system with their associated farm information.
 *     tags: [Flocs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of flocs retrieved successfully
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
 *                     $ref: '#/components/schemas/Floc'
 *                 message:
 *                   type: string
 *                   example: "Success"
 *             example:
 *               success: true
 *               data:
 *                 - floc_id: "1"
 *                   floc_name: "Floc A"
 *                   farm_id: "1"
 *                   starting_date: "2024-01-01"
 *                   ending_date: null
 *               message: "Success"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  return FlocController.readAll();
}

