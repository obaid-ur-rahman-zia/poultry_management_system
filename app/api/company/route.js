import CompanyController from "@/app/controllers/company/companyController";

/**
 * @swagger
 * /api/company:
 *   post:
 *     summary: Create a new company
 *     description: Create a new company profile in the system. This is typically used for multi-company setups.
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company_name
 *             properties:
 *               company_name:
 *                 type: string
 *                 description: Company name
 *                 example: "ABC Poultry Ltd"
 *               company_address:
 *                 type: string
 *                 description: Company address
 *                 example: "789 Business Park"
 *               company_contact:
 *                 type: string
 *                 description: Company contact number
 *                 example: "+923001234570"
 *               status:
 *                 type: number
 *                 enum: [0, 1]
 *                 default: 1
 *                 description: Company status
 *                 example: 1
 *           example:
 *             company_name: "ABC Poultry Ltd"
 *             company_address: "789 Business Park"
 *             company_contact: "+923001234570"
 *             status: 1
 *     responses:
 *       201:
 *         description: Company created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 company_id: "1"
 *               message: "Company created successfully"
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(req) {
  return CompanyController.create(req);
}

/**
 * @swagger
 * /api/company:
 *   put:
 *     summary: Update an existing company
 *     description: Update company information in the system.
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company_id
 *             properties:
 *               company_id:
 *                 type: string
 *                 description: Company ID
 *                 example: "1"
 *               company_name:
 *                 type: string
 *                 description: Company name
 *                 example: "ABC Poultry Ltd Updated"
 *               company_address:
 *                 type: string
 *                 description: Company address
 *                 example: "789 Updated Business Park"
 *               company_contact:
 *                 type: string
 *                 description: Company contact number
 *                 example: "+923001234570"
 *               status:
 *                 type: number
 *                 enum: [0, 1]
 *                 description: Company status
 *                 example: 1
 *           example:
 *             company_id: "1"
 *             company_name: "ABC Poultry Ltd Updated"
 *             company_address: "789 Updated Business Park"
 *             company_contact: "+923001234570"
 *             status: 1
 *     responses:
 *       200:
 *         description: Company updated successfully
 *       404:
 *         description: Company not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req) {
  return CompanyController.update(req);
}
