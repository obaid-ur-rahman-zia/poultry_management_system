import EmployeeController from "@/app/controllers/employee/employeeController";

/**
 * @swagger
 * /api/employee:
 *   post:
 *     summary: Create a new employee
 *     description: Create a new employee in the system with designation and area assignment.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emp_name
 *               - emp_contact
 *               - designation_id
 *             properties:
 *               emp_name:
 *                 type: string
 *                 description: Employee name
 *                 example: "Ahmed Khan"
 *               emp_contact:
 *                 type: string
 *                 description: Employee contact number
 *                 example: "+923001234569"
 *               designation_id:
 *                 type: string
 *                 description: Employee designation ID
 *                 example: "1"
 *               area_id:
 *                 type: string
 *                 description: Area ID for employee assignment
 *                 example: "1"
 *           example:
 *             emp_name: "Ahmed Khan"
 *             emp_contact: "+923001234569"
 *             designation_id: "1"
 *             area_id: "1"
 *     responses:
 *       201:
 *         description: Employee created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 emp_id: "1"
 *               message: "Employee created successfully"
 *       400:
 *         description: Bad request - Invalid input data
 *       500:
 *         description: Internal server error
 */
export async function POST(req) {
  return EmployeeController.create(req);
}

/**
 * @swagger
 * /api/employee:
 *   put:
 *     summary: Update an existing employee
 *     description: Update employee information in the system.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emp_id
 *             properties:
 *               emp_id:
 *                 type: string
 *                 description: Employee ID
 *                 example: "1"
 *               emp_name:
 *                 type: string
 *                 description: Employee name
 *                 example: "Ahmed Khan Updated"
 *               emp_contact:
 *                 type: string
 *                 description: Employee contact number
 *                 example: "+923001234569"
 *               designation_id:
 *                 type: string
 *                 description: Employee designation ID
 *                 example: "2"
 *               area_id:
 *                 type: string
 *                 description: Area ID
 *                 example: "2"
 *           example:
 *             emp_id: "1"
 *             emp_name: "Ahmed Khan Updated"
 *             emp_contact: "+923001234569"
 *             designation_id: "2"
 *             area_id: "2"
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req) {
  return EmployeeController.update(req);
}
