import CategoryController from "@/app/controllers/category/categoryController";

/**
 * @swagger
 * /api/category:
 *   post:
 *     summary: Create a new category
 *     description: Create a new product category in the system for organizing products.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category_name
 *             properties:
 *               category_name:
 *                 type: string
 *                 description: Category name
 *                 example: "Poultry Feed"
 *               status:
 *                 type: number
 *                 enum: [0, 1]
 *                 default: 1
 *                 description: Category status
 *                 example: 1
 *           example:
 *             category_name: "Poultry Feed"
 *             status: 1
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 category_id: "1"
 *               message: "Category created successfully"
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(req) {
  return CategoryController.create(req);
}

/**
 * @swagger
 * /api/category:
 *   put:
 *     summary: Update an existing category
 *     description: Update category information in the system.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category_id
 *             properties:
 *               category_id:
 *                 type: string
 *                 description: Category ID
 *                 example: "1"
 *               category_name:
 *                 type: string
 *                 description: Category name
 *                 example: "Poultry Feed Updated"
 *               status:
 *                 type: number
 *                 enum: [0, 1]
 *                 description: Category status
 *                 example: 1
 *           example:
 *             category_id: "1"
 *             category_name: "Poultry Feed Updated"
 *             status: 1
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req) {
  return CategoryController.update(req);
}
