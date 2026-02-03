import userController from "@/app/controllers/user/userController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { errorResponse } from "@/app/utils/response";

/**
 * @swagger
 * /api/user:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user in the system. Only accessible by SUPER_ADMIN. Request body must be wrapped in req_object.
 *     tags: [Users]
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
 *                 required: [email, password, role, user_nam]
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                     description: User email address
 *                   password:
 *                     type: string
 *                     format: password
 *                     description: User password
 *                   user_nam:
 *                     type: string
 *                     description: User full name
 *                   role:
 *                     type: string
 *                     enum: [SUPER_ADMIN, ADMIN, USER]
 *                     description: User role
 *                   status:
 *                     type: integer
 *                     enum: [0, 1]
 *                     default: 1
 *                     description: User status (1 = active, 0 = inactive)
 *           example:
 *             req_object:
 *               email: "admin@example.com"
 *               password: "securePassword"
 *               user_nam: "Admin User"
 *               role: "ADMIN"
 *               status: 1
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       403:
 *         description: Unauthorized - Only SUPER_ADMIN can create users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Bad request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(req) {
  // Check if user is SUPER_ADMIN
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "SUPER_ADMIN") {
    return errorResponse(new Error("Unauthorized: Only SUPER_ADMIN can create users"), 403);
  }
  return userController.create(req);
}

/**
 * @swagger
 * /api/user:
 *   put:
 *     summary: Update a user
 *     description: Update an existing user in the system. Only accessible by SUPER_ADMIN. Request body must be wrapped in req_object.
 *     tags: [Users]
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
 *                 required: [user_id]
 *                 properties:
 *                   user_id:
 *                     type: string
 *                     description: User ID to update
 *                   email:
 *                     type: string
 *                     format: email
 *                     description: User email address
 *                   user_nam:
 *                     type: string
 *                     description: User full name
 *                   role:
 *                     type: string
 *                     enum: [SUPER_ADMIN, ADMIN, USER]
 *                     description: User role
 *                   status:
 *                     type: integer
 *                     enum: [0, 1]
 *                     description: User status (1 = active, 0 = inactive)
 *           example:
 *             req_object:
 *               user_id: "1"
 *               user_nam: "Updated Name"
 *               email: "updated@example.com"
 *               role: "ADMIN"
 *               status: 1
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       403:
 *         description: Unauthorized - Only SUPER_ADMIN can update users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function PUT(req) {
  // Check if user is SUPER_ADMIN
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "SUPER_ADMIN") {
    return errorResponse(new Error("Unauthorized: Only SUPER_ADMIN can update users"), 403);
  }
  return userController.update(req);
}

