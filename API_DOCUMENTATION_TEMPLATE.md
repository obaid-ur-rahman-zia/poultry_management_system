# API Documentation Template Guide

Yeh guide aapko batayega ke kaise baaki API routes ko document karein with detailed descriptions aur examples.

## Template for GET (readAll) Routes

```javascript
/**
 * @swagger
 * /api/{resource}/readAll:
 *   get:
 *     summary: Get all {resources}
 *     description: Retrieve a list of all {resources} in the system.
 *     tags: [{TagName}]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of {resources} retrieved successfully
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
 *                     $ref: '#/components/schemas/{Resource}'
 *                 message:
 *                   type: string
 *                   example: "Success"
 *             example:
 *               success: true
 *               data:
 *                 - id: "1"
 *                   name: "Example Name"
 *               message: "Success"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
```

## Template for GET (readById) Routes

```javascript
/**
 * @swagger
 * /api/{resource}/readById:
 *   get:
 *     summary: Get {resource} by ID
 *     description: Retrieve a specific {resource} by their ID.
 *     tags: [{TagName}]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: {id_field}
 *         required: true
 *         schema:
 *           type: string
 *         description: {Resource} ID
 *         example: "1"
 *     responses:
 *       200:
 *         description: {Resource} retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/{Resource}'
 *                 message:
 *                   type: string
 *                   example: "Success"
 *             example:
 *               success: true
 *               data:
 *                 id: "1"
 *                 name: "Example Name"
 *               message: "Success"
 *       400:
 *         description: Bad request - {id_field} parameter is required
 *       404:
 *         description: {Resource} not found
 *       500:
 *         description: Internal server error
 */
```

## Template for POST (Create) Routes

```javascript
/**
 * @swagger
 * /api/{resource}:
 *   post:
 *     summary: Create a new {resource}
 *     description: Create a new {resource} in the system.
 *     tags: [{TagName}]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - field1
 *               - field2
 *             properties:
 *               field1:
 *                 type: string
 *                 description: Description of field1
 *                 example: "Example Value 1"
 *               field2:
 *                 type: string
 *                 description: Description of field2
 *                 example: "Example Value 2"
 *           example:
 *             field1: "Example Value 1"
 *             field2: "Example Value 2"
 *     responses:
 *       201:
 *         description: {Resource} created successfully
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
 *                     id:
 *                       type: string
 *                       example: "1"
 *                 message:
 *                   type: string
 *                   example: "{Resource} created successfully"
 *             example:
 *               success: true
 *               data:
 *                 id: "1"
 *               message: "{Resource} created successfully"
 *       400:
 *         description: Bad request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "field1 is required"
 *               statusCode: 400
 *       500:
 *         description: Internal server error
 */
```

## Template for PUT (Update) Routes

```javascript
/**
 * @swagger
 * /api/{resource}:
 *   put:
 *     summary: Update an existing {resource}
 *     description: Update {resource} information in the system.
 *     tags: [{TagName}]
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
 *                 description: {Resource} ID
 *                 example: "1"
 *               field1:
 *                 type: string
 *                 description: Description of field1
 *                 example: "Updated Value 1"
 *               field2:
 *                 type: string
 *                 description: Description of field2
 *                 example: "Updated Value 2"
 *           example:
 *             id: "1"
 *             field1: "Updated Value 1"
 *             field2: "Updated Value 2"
 *     responses:
 *       200:
 *         description: {Resource} updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               data:
 *                 id: "1"
 *               message: "{Resource} updated successfully"
 *       404:
 *         description: {Resource} not found
 *       500:
 *         description: Internal server error
 */
```

## Template for DELETE Routes

```javascript
/**
 * @swagger
 * /api/{resource}:
 *   delete:
 *     summary: Delete a {resource}
 *     description: Delete a {resource} from the system.
 *     tags: [{TagName}]
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
 *                 description: {Resource} ID to delete
 *                 example: "1"
 *           example:
 *             id: "1"
 *     responses:
 *       200:
 *         description: {Resource} deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "{Resource} deleted successfully"
 *       404:
 *         description: {Resource} not found
 *       500:
 *         description: Internal server error
 */
```

## Important Points

1. **Always include examples**: Har request body aur response mein example add karein
2. **Detailed descriptions**: Har endpoint ki clear description likhein
3. **Required fields**: Request body mein required fields clearly mention karein
4. **Response codes**: Saare possible response codes document karein (200, 201, 400, 401, 404, 500)
5. **Tags**: Appropriate tags use karein (Users, Products, Customers, etc.)
6. **Security**: Har endpoint mein `bearerAuth` security add karein

## Remaining Routes to Document

### Already Documented:
- ✅ Customer routes (POST, PUT, GET readAll, GET readById)
- ✅ Supplier routes (POST, PUT, GET readAll, GET readById)
- ✅ Employee routes (POST, PUT, GET readAll, GET readById)
- ✅ Farm routes (POST, PUT, DELETE, GET readAll)
- ✅ Floc routes (POST, PUT, DELETE, GET readAll)
- ✅ Product routes (POST, PUT, DELETE, GET readAll)
- ✅ User routes (POST, PUT, GET readAll)
- ✅ Sale routes (GET readAll)
- ✅ Purchase routes (GET readAll)

### Need Documentation:
- Sale routes (POST, PUT, GET readById)
- Purchase routes (POST, PUT, GET readById)
- Account routes (all)
- Transaction routes (all)
- Vehicle routes (all)
- Unit routes (all)
- Area/Subarea routes (all)
- Category routes (all)
- Warehouse routes (all)
- Company routes (all)
- Voucher routes (all)
- Trading routes (all)
- Quotation routes (all)
- SaleReturn routes (all)
- PurchaseReturn routes (all)
- UnitSale routes (all)
- UnitExpense routes (all)
- And more...

## Quick Reference

- **GET readAll**: List all resources
- **GET readById**: Get single resource by ID
- **POST**: Create new resource
- **PUT**: Update existing resource
- **DELETE**: Delete resource

Har route file ke upar JSDoc comments add karein using these templates!

