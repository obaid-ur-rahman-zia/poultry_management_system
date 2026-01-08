import CustomerController from "@/app/controllers/customer/customerController";

/**
 * @swagger
 * /api/customer/readAll:
 *   get:
 *     summary: Get all customers
 *     description: Retrieve a list of all customers in the system along with the next available customer ID.
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of customers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     customer_data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Customer'
 *                     nextId:
 *                       type: string
 *                       description: Next available customer ID
 *                       example: "2"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *             example:
 *               success: true
 *               data:
 *                 customer_data:
 *                   - acc_id: "1"
 *                     customer_name: "John Doe"
 *                     customer_address: "123 Main Street"
 *                     customer_contact: "+923001234567"
 *                     customer_cnic: "12345-1234567-1"
 *                 nextId: "2"
 *               message: "Success"
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  return CustomerController.readAll();
}
