import WholeSaleController from "@/app/controllers/wholeSale/wholeSaleController";

/**
 * @swagger
 * /api/wholeSale:
 *   post:
 *     summary: Create a new whole sale
 *     description: Create a new whole sale entry. Request body must be wrapped in req_object. Required fields include sale_date, former_account, purcher_account, van_number, weight, former_rate, former_amount, purcher_amount.
 *     tags: [Sales]
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
 *                 required: [sale_date, former_account, purcher_account, van_number, weight, former_rate, former_amount, purcher_amount]
 *                 properties:
 *                   sale_date:
 *                     type: string
 *                     format: date
 *                     description: Sale date
 *                   farm_rate:
 *                     type: number
 *                     description: Farm rate (optional; set_fs_rate can save it for date)
 *                   sale_rate:
 *                     type: number
 *                     description: Sale rate (optional; set_fs_rate can save it for date)
 *                   former_account:
 *                     type: integer
 *                     description: Former (supplier) account ID
 *                   purcher_account:
 *                     type: integer
 *                     description: Purcher (customer) account ID
 *                   van_number:
 *                     type: string
 *                     description: Van number
 *                   weight:
 *                     type: number
 *                     description: Weight
 *                   former_rate:
 *                     type: number
 *                   former_amount:
 *                     type: number
 *                   purcher_amount:
 *                     type: number
 *                   set_fs_rate:
 *                     type: boolean
 *                     description: If true, saves farm_rate/sale_rate for this date
 *           example:
 *             req_object:
 *               sale_date: "2024-01-15"
 *               former_account: 1
 *               purcher_account: 2
 *               van_number: "VAN-001"
 *               weight: 500
 *               former_rate: 200
 *               former_amount: 100000
 *               purcher_amount: 110000
 *     responses:
 *       201:
 *         description: Whole sale created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(req) {
  return WholeSaleController.create(req);
}

/**
 * @swagger
 * /api/wholeSale:
 *   put:
 *     summary: Update an existing whole sale
 *     description: Update whole sale. Request body must be wrapped in req_object. sale_id is required; other fields same as POST.
 *     tags: [Sales]
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
 *                 required: [sale_id, sale_date, former_account, purcher_account, van_number, weight, former_rate, former_amount, purcher_amount]
 *                 properties:
 *                   sale_id:
 *                     type: integer
 *                     description: Whole sale ID to update
 *                   sale_date:
 *                     type: string
 *                     format: date
 *                   farm_rate:
 *                     type: number
 *                   sale_rate:
 *                     type: number
 *                   former_account:
 *                     type: integer
 *                   purcher_account:
 *                     type: integer
 *                   van_number:
 *                     type: string
 *                   weight:
 *                     type: number
 *                   former_rate:
 *                     type: number
 *                   former_amount:
 *                     type: number
 *                   purcher_amount:
 *                     type: number
 *                   set_fs_rate:
 *                     type: boolean
 *           example:
 *             req_object:
 *               sale_id: 1
 *               sale_date: "2024-01-15"
 *               former_account: 1
 *               purcher_account: 2
 *               van_number: "VAN-001"
 *               weight: 550
 *               former_rate: 205
 *               former_amount: 112750
 *               purcher_amount: 120000
 *     responses:
 *       200:
 *         description: Whole sale updated successfully
 *       404:
 *         description: Whole sale not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req) {
  return WholeSaleController.update(req);
}

/**
 * @swagger
 * /api/wholeSale:
 *   delete:
 *     summary: Delete a whole sale
 *     description: Soft delete a whole sale (typically via query param or body with sale_id).
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Whole sale deleted successfully
 *       404:
 *         description: Whole sale not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(req) {
  return WholeSaleController.delete(req);
}
