import CategoryController from "@/app/controllers/category/categoryController";

/**
 * @swagger
 * /api/category/readAll:
 *   get:
 *     summary: Get all categories
 *     description: Retrieve a list of all product categories in the system.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories retrieved successfully
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
 *                       category_id:
 *                         type: string
 *                         example: "1"
 *                       category_name:
 *                         type: string
 *                         example: "Poultry Feed"
 *                       status:
 *                         type: number
 *                         example: 1
 *                 message:
 *                   type: string
 *                   example: "Success"
 *             example:
 *               success: true
 *               data:
 *                 - category_id: "1"
 *                   category_name: "Poultry Feed"
 *                   status: 1
 *               message: "Success"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET() {
  return CategoryController.readAll();
}
