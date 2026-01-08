import FarmController from "@/app/controllers/farm/farmController";

/**
 * @swagger
 * /api/farm/readAll:
 *   get:
 *     summary: Get all farms
 *     description: Retrieve a list of all farms in the system.
 *     tags: [Farms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of farms retrieved successfully
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
 *                     $ref: '#/components/schemas/Farm'
 *                 message:
 *                   type: string
 *                   example: "Success"
 *             example:
 *               success: true
 *               data:
 *                 - farm_id: "1"
 *                   farm_name: "Main Farm"
 *                   farm_address: "789 Farm Road"
 *                   status: 1
 *               message: "Success"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  return FarmController.readAll();
}

