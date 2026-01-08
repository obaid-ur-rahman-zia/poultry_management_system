# Swagger API Documentation Setup

Yeh guide aapko batayega ke kaise Swagger/OpenAPI documentation setup karein Next.js application mein.

## Installation

Pehle required packages install karein:

```bash
npm install swagger-jsdoc swagger-ui-react
```

## Files Created

1. **`app/utils/swagger.js`** - Swagger configuration file
2. **`app/api/swagger.json/route.js`** - API endpoint jo OpenAPI spec return karta hai
3. **`app/api-docs/page.jsx`** - Swagger UI page jo documentation display karta hai

## Usage

### 1. Documentation Dekhne Ke Liye

Development server start karein:
```bash
npm run dev
```

Phir browser mein jayein:
```
http://localhost:3000/api-docs
```

### 2. API Routes Mein Documentation Add Karna

Kisi bhi API route file mein JSDoc comments add karein. Example:

```javascript
/**
 * @swagger
 * /api/user/readAll:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
export async function GET(req) {
  // Your code here
}
```

### 3. Common Swagger Annotations

#### GET Request Example:
```javascript
/**
 * @swagger
 * /api/product/readAll:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Success
 */
```

#### POST Request Example:
```javascript
/**
 * @swagger
 * /api/product:
 *   post:
 *     summary: Create product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 */
```

#### PUT Request Example:
```javascript
/**
 * @swagger
 * /api/product:
 *   put:
 *     summary: Update product
 *     tags: [Products]
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
 *     responses:
 *       200:
 *         description: Updated
 */
```

#### DELETE Request Example:
```javascript
/**
 * @swagger
 * /api/product:
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
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
 *     responses:
 *       200:
 *         description: Deleted
 */
```

### 4. Authentication Setup

Swagger UI mein authentication test karne ke liye:

1. Browser mein `/api-docs` page open karein
2. Top right corner mein "Authorize" button click karein
3. Bearer token enter karein (NextAuth session token)
4. "Authorize" click karein

### 5. Custom Schemas Add Karna

`app/utils/swagger.js` file mein `components.schemas` section mein naye schemas add kar sakte hain:

```javascript
components: {
  schemas: {
    YourNewSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        // ... more properties
      },
    },
  },
}
```

Phir API routes mein reference karein:
```javascript
$ref: '#/components/schemas/YourNewSchema'
```

## Tips

1. **Tags**: Har endpoint ko appropriate tag assign karein (Users, Products, etc.)
2. **Descriptions**: Clear aur detailed descriptions add karein
3. **Response Codes**: Saare possible response codes document karein
4. **Request/Response Examples**: Examples add karein taake developers easily samajh saken

## Troubleshooting

Agar Swagger UI load nahi ho raha:

1. Check karein ke packages install ho gaye hain
2. Check browser console for errors
3. Verify ke `/api/swagger.json` endpoint sahi kaam kar raha hai
4. Check ke API route files mein JSDoc comments sahi format mein hain

## Production Deployment

Production mein, Swagger documentation ko secure rakhein. Agar chahein to middleware add kar sakte hain jo sirf authenticated users ko access de:

```javascript
// app/api-docs/page.jsx ya middleware.js mein
// Add authentication check
```

## Resources

- [Swagger JSDoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI React](https://github.com/swagger-api/swagger-ui)

