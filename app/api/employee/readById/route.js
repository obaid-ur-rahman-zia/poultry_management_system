import EmployeeController from "@/app/controllers/employee/employeeController";

/**
 * @swagger
 * /api/employee/readById:
 *   get:
 *     summary: Get employee by ID
 *     description: Retrieve a specific employee by their employee ID.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: emp_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *         example: "1"
 *     responses:
 *       200:
 *         description: Employee retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *                 message:
 *                   type: string
 *                   example: "Success"
 *             example:
 *               success: true
 *               data:
 *                 emp_id: "1"
 *                 emp_name: "Ahmed Khan"
 *                 emp_contact: "+923001234569"
 *                 designation_id: "1"
 *                 area_id: "1"
 *               message: "Success"
 *       400:
 *         description: Bad request - emp_id parameter is required
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */
export async function GET(req) {
  return EmployeeController.readById(req);
}
