import AreaController from "@/app/controllers/area/areaController";

/**
 * @swagger
 * /api/area/readAll:
 *   get:
 *     summary: Get all areas
 *     description: Retrieve a list of all areas in the system.
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of areas retrieved successfully
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
 *                       area_id:
 *                         type: string
 *                         example: "1"
 *                       area_name:
 *                         type: string
 *                         example: "North Zone"
 *                       status:
 *                         type: number
 *                         example: 1
 *                 message:
 *                   type: string
 *                   example: "Success"
 *             example:
 *               success: true
 *               data:
 *                 - area_id: "1"
 *                   area_name: "North Zone"
 *                   status: 1
 *               message: "Success"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  return AreaController.readAll();
}
