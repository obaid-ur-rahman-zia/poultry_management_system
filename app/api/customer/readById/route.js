import CustomerController from "@/app/controllers/customer/customerController";

/**
 * @swagger
 * /api/customer/readById:
 *   get:
 *     summary: Get customer by ID
 *     description: Retrieve a specific customer by their account ID. The ID should be passed as a query parameter.
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: acc_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer account ID
 *         example: "1"
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *                 message:
 *                   type: string
 *                   example: "Success"
 *             example:
 *               success: true
 *               data:
 *                 acc_id: "1"
 *                 customer_name: "John Doe"
 *                 customer_address: "123 Main Street, City"
 *                 customer_contact: "+923001234567"
 *                 customer_cnic: "12345-1234567-1"
 *                 cgroup_id: "1"
 *                 subarea_id: "1"
 *               message: "Success"
 *       400:
 *         description: Bad request - acc_id parameter is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "acc_id is required"
 *               statusCode: 400
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
export async function GET(req) {
  return CustomerController.readById(req);
}
