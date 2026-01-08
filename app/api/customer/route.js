import CustomerController from "@/app/controllers/customer/customerController";

/**
 * @swagger
 * /api/customer:
 *   post:
 *     summary: Create a new customer
 *     description: Create a new customer in the system. This will also create an account entry for the customer.
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_name
 *               - customer_address
 *               - customer_contact
 *               - customer_cnic
 *             properties:
 *               customer_name:
 *                 type: string
 *                 description: Customer full name
 *                 example: "John Doe"
 *               customer_address:
 *                 type: string
 *                 description: Customer address
 *                 example: "123 Main Street, City, Country"
 *               customer_alternate_name:
 *                 type: string
 *                 description: Alternate name for customer
 *                 example: "JD Enterprises"
 *               customer_contact:
 *                 type: string
 *                 description: Customer contact number
 *                 example: "+923001234567"
 *               customer_reference:
 *                 type: string
 *                 description: Reference information
 *                 example: "Referred by ABC"
 *               customer_cnic:
 *                 type: string
 *                 description: Customer CNIC number
 *                 example: "12345-1234567-1"
 *               cgroup_id:
 *                 type: string
 *                 description: Customer group ID
 *                 example: "1"
 *               subarea_id:
 *                 type: string
 *                 description: Subarea ID
 *                 example: "1"
 *           example:
 *             customer_name: "John Doe"
 *             customer_address: "123 Main Street, City"
 *             customer_contact: "+923001234567"
 *             customer_cnic: "12345-1234567-1"
 *             cgroup_id: "1"
 *             subarea_id: "1"
 *     responses:
 *       201:
 *         description: Customer created successfully
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
 *                     acc_id:
 *                       type: string
 *                       example: "1"
 *                 message:
 *                   type: string
 *                   example: "Customer created successfully"
 *             example:
 *               success: true
 *               data:
 *                 acc_id: "1"
 *               message: "Customer created successfully"
 *       400:
 *         description: Bad request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "customer_name is required"
 *               statusCode: 400
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(req) {
  return CustomerController.create(req);
}

/**
 * @swagger
 * /api/customer:
 *   put:
 *     summary: Update an existing customer
 *     description: Update customer information in the system. All fields are optional except customer ID.
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - acc_id
 *             properties:
 *               acc_id:
 *                 type: string
 *                 description: Customer account ID
 *                 example: "1"
 *               customer_name:
 *                 type: string
 *                 description: Customer full name
 *                 example: "John Doe Updated"
 *               customer_address:
 *                 type: string
 *                 description: Customer address
 *                 example: "456 Updated Street, City"
 *               customer_contact:
 *                 type: string
 *                 description: Customer contact number
 *                 example: "+923001234567"
 *               customer_cnic:
 *                 type: string
 *                 description: Customer CNIC number
 *                 example: "12345-1234567-1"
 *               cgroup_id:
 *                 type: string
 *                 description: Customer group ID
 *                 example: "2"
 *               subarea_id:
 *                 type: string
 *                 description: Subarea ID
 *                 example: "2"
 *           example:
 *             acc_id: "1"
 *             customer_name: "John Doe Updated"
 *             customer_address: "456 Updated Street"
 *             customer_contact: "+923001234567"
 *     responses:
 *       200:
 *         description: Customer updated successfully
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
 *                   example: "Customer updated successfully"
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Customer not found"
 *               statusCode: 404
 *       500:
 *         description: Internal server error
 */
export async function PUT(req) {
  return CustomerController.update(req);
}
