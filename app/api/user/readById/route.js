import userController from "@/app/controllers/user/userController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { errorResponse } from "@/app/utils/response";

export async function GET(req) {
  // Check if user is SUPER_ADMIN
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "SUPER_ADMIN") {
    return errorResponse(new Error("Unauthorized: Only SUPER_ADMIN can view user details"), 403);
  }
  return userController.readById(req);
}

