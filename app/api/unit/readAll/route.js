import UnitController from "@/app/controllers/unit/unitController";

/**
 * @swagger
 * /api/unit/readAll:
 *   get:
 *     summary: Get all units
 *     description: Retrieve a list of all units in the system.
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of units retrieved successfully
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
 *                       unit_id:
 *                         type: string
 *                         example: "1"
 *                       unit_name:
 *                         type: string
 *                         example: "Kilogram"
 *                       unit_short_name:
 *                         type: string
 *                         example: "kg"
 *                       status:
 *                         type: number
 *                         example: 1
 *                 message:
 *                   type: string
 *                   example: "Success"
 *             example:
 *               success: true
 *               data:
 *                 - unit_id: "1"
 *                   unit_name: "Kilogram"
 *                   unit_short_name: "kg"
 *                   status: 1
 *               message: "Success"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(req) {
  return UnitController.readAll(req);
}
