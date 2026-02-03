import ProductController from "@/app/controllers/product/productController";

/**
 * @swagger
 * /api/product:
 *   post:
 *     summary: Create a new product
 *     description: Create a new product in the system. Request body must be wrapped in req_object.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [req_object]
 *             properties:
 *               req_object:
 *                 type: object
 *                 required: [product_title, procategory_id, company_id, purchase_price, sale_price]
 *                 properties:
 *                   product_title:
 *                     type: string
 *                     description: Product name
 *                   procategory_id:
 *                     type: integer
 *                     description: Product category ID
 *                   company_id:
 *                     type: integer
 *                     description: Company ID
 *                   purchase_price:
 *                     type: number
 *                     description: Purchase price
 *                   sale_price:
 *                     type: number
 *                     description: Sale price
 *                   product_description:
 *                     type: string
 *                     description: Product description (optional)
 *           example:
 *             req_object:
 *               product_title: "Chicken Feed 25kg"
 *               procategory_id: 1
 *               company_id: 1
 *               purchase_price: 1500
 *               sale_price: 1800
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: integer
 *       400:
 *         description: Bad request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(req) {
  return ProductController.create(req);
}

/**
 * @swagger
 * /api/product:
 *   put:
 *     summary: Update a product
 *     description: Update an existing product in the system. Request body must be wrapped in req_object.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [req_object]
 *             properties:
 *               req_object:
 *                 type: object
 *                 required: [product_id]
 *                 properties:
 *                   product_id:
 *                     type: integer
 *                     description: Product ID to update
 *                   product_title:
 *                     type: string
 *                     description: Product name
 *                   procategory_id:
 *                     type: integer
 *                     description: Product category ID
 *                   company_id:
 *                     type: integer
 *                     description: Company ID
 *                   purchase_price:
 *                     type: number
 *                     description: Purchase price
 *                   sale_price:
 *                     type: number
 *                     description: Sale price
 *                   product_description:
 *                     type: string
 *                     description: Product description
 *           example:
 *             req_object:
 *               product_id: 1
 *               product_title: "Chicken Feed 25kg Updated"
 *               sale_price: 1900
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: integer
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function PUT(req) {
  return ProductController.update(req);
}

/**
 * @swagger
 * /api/product:
 *   delete:
 *     summary: Delete a product
 *     description: Delete a product from the system
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 description: Product ID to delete
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function DELETE(req) {
  return ProductController.delete(req);
}