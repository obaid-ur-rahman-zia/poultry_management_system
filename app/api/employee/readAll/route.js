import EmployeeController from "@/app/controllers/employee/employeeController";

/**
 * @swagger
 * /api/employee/readAll:
 *   get:
 *     summary: Get all employees
 *     description: Retrieve a list of all employees in the system along with their designations and assigned areas.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of employees retrieved successfully
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
 *                     employee_data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Employee'
 *                     nextId:
 *                       type: string
 *                       example: "2"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *             example:
 *               success: true
 *               data:
 *                 employee_data:
 *                   - emp_id: "1"
 *                     emp_name: "Ahmed Khan"
 *                     emp_contact: "+923001234569"
 *                     designation_id: "1"
 *                     area_id: "1"
 *                 nextId: "2"
 *               message: "Success"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  return EmployeeController.readAll();
}
