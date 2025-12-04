import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { successResponse, errorResponse } from "@/app/utils/response";
import UserRepository from "@/app/repositories/user/userRepository";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return errorResponse(new Error("Unauthorized"), 401);
    }

    const userId = parseInt(session.user.id);
    
    // Get user with cash in hand account
    const user = await UserRepository.readById(userId);
    
    if (!user) {
      return errorResponse(new Error("User not found"), 404);
    }

    if (!user.cash_in_hand_account) {
      return errorResponse(new Error("Cash In Hand account not found for this user"), 404);
    }

    return successResponse(
      { account: user.cash_in_hand_account },
      "Cash In Hand account retrieved successfully"
    );
  } catch (error) {
    console.error("Error fetching Cash In Hand account:", error);
    return errorResponse(error, 500);
  }
}

