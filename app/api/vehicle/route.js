import VehicleController from "@/app/controllers/vehicle/vehicleController";

/**
 * @swagger
 * /api/vehicle:
 *   post:
 *     summary: Create a new vehicle
 *     description: Create a new vehicle in the system for transportation and logistics management.
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicle_name
 *               - vehicle_type_id
 *             properties:
 *               vehicle_name:
 *                 type: string
 *                 description: Vehicle name or number
 *                 example: "Truck-001"
 *               vehicle_type_id:
 *                 type: string
 *                 description: Vehicle type ID
 *                 example: "1"
 *               status:
 *                 type: number
 *                 enum: [0, 1]
 *                 default: 1
 *                 description: Vehicle status
 *                 example: 1
 *           example:
 *             vehicle_name: "Truck-001"
 *             vehicle_type_id: "1"
 *             status: 1
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 vehicle_id: "1"
 *               message: "Vehicle created successfully"
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(req) {
  return VehicleController.create(req);
}

/**
 * @swagger
 * /api/vehicle:
 *   put:
 *     summary: Update an existing vehicle
 *     description: Update vehicle information in the system.
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicle_id
 *             properties:
 *               vehicle_id:
 *                 type: string
 *                 description: Vehicle ID
 *                 example: "1"
 *               vehicle_name:
 *                 type: string
 *                 description: Vehicle name or number
 *                 example: "Truck-001 Updated"
 *               vehicle_type_id:
 *                 type: string
 *                 description: Vehicle type ID
 *                 example: "1"
 *               status:
 *                 type: number
 *                 enum: [0, 1]
 *                 description: Vehicle status
 *                 example: 1
 *           example:
 *             vehicle_id: "1"
 *             vehicle_name: "Truck-001 Updated"
 *             vehicle_type_id: "1"
 *             status: 1
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req) {
  return VehicleController.update(req);
}
