import CompanyController from "@/app/controllers/company/companyController";

/**
 * @swagger
 * /api/company/readAll:
 *   get:
 *     summary: Get all companies
 *     description: Retrieve a list of all companies in the system.
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of companies retrieved successfully
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
 *                       company_id:
 *                         type: string
 *                         example: "1"
 *                       company_name:
 *                         type: string
 *                         example: "ABC Poultry Ltd"
 *                       company_address:
 *                         type: string
 *                         example: "789 Business Park"
 *                       company_contact:
 *                         type: string
 *                         example: "+923001234570"
 *                       status:
 *                         type: number
 *                         example: 1
 *                 message:
 *                   type: string
 *                   example: "Success"
 *             example:
 *               success: true
 *               data:
 *                 - company_id: "1"
 *                   company_name: "ABC Poultry Ltd"
 *                   company_address: "789 Business Park"
 *                   company_contact: "+923001234570"
 *                   status: 1
 *               message: "Success"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  return CompanyController.readAll();
}
