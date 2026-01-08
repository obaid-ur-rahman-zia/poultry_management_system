import userController from "@/app/controllers/user/userController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { errorResponse } from "@/app/utils/response";

/**
 * @swagger
 * /api/user/readAll:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users. Only accessible by SUPER_ADMIN and ADMIN roles.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: Filter users by status (1 = active, 0 = inactive)
 *       - in: query
 *         name: excludeSuperAdmin
 *         schema:
 *           type: boolean
 *         description: Exclude SUPER_ADMIN users from results
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
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
 *       403:
 *         description: Unauthorized - Only SUPER_ADMIN and ADMIN can access this endpoint
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(req) {
  // Check if user is SUPER_ADMIN or ADMIN
  const session = await getServerSession(authOptions);
  if (!session || (session.user?.role !== "SUPER_ADMIN" && session.user?.role !== "ADMIN")) {
    return errorResponse(new Error("Unauthorized: Only SUPER_ADMIN and ADMIN can view users"), 403);
  }
  
  try {
    // Use Next.js 13+ App Router way to get search params
    const searchParams = req.nextUrl?.searchParams || new URL(req.url).searchParams;
    const status = searchParams.get("status");
    const excludeSuperAdmin = searchParams.get("excludeSuperAdmin") === "true";
    
    console.log("API Route - Session role:", session.user?.role); // Debug log
    console.log("API Route - excludeSuperAdmin param:", excludeSuperAdmin); // Debug log
    
    // If excludeSuperAdmin is true OR if current user is ADMIN (not SUPER_ADMIN), exclude SUPER_ADMIN role
    // This ensures ADMIN users never see SUPER_ADMIN users
    const currentUserRole = session.user?.role;
    const shouldExcludeSuperAdmin = excludeSuperAdmin || (currentUserRole === "ADMIN" && currentUserRole !== "SUPER_ADMIN");
    const roleToExclude = shouldExcludeSuperAdmin ? "SUPER_ADMIN" : null;
    
    console.log("API Route - roleToExclude:", roleToExclude); // Debug log
    
    return userController.readAll(
      status ? Number(status) : null,
      roleToExclude
    );
  } catch (error) {
    console.error("Error in user readAll route:", error);
    // Fallback - return all users
    return userController.readAll(null, null);
  }
}

