import VehicleController from "@/app/controllers/vehicle/vehicleController";

/**
 * @swagger
 * /api/vehicle/readAll:
 *   get:
 *     summary: Get all vehicles
 *     description: Retrieve a list of all vehicles in the system with their type information.
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of vehicles retrieved successfully
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
 *                       vehicle_id:
 *                         type: string
 *                         example: "1"
 *                       vehicle_name:
 *                         type: string
 *                         example: "Truck-001"
 *                       vehicle_type_id:
 *                         type: string
 *                         example: "1"
 *                       status:
 *                         type: number
 *                         example: 1
 *                 message:
 *                   type: string
 *                   example: "Success"
 *             example:
 *               success: true
 *               data:
 *                 - vehicle_id: "1"
 *                   vehicle_name: "Truck-001"
 *                   vehicle_type_id: "1"
 *                   status: 1
 *               message: "Success"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  return VehicleController.readAll();
}
