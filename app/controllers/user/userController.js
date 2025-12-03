/* eslint-disable @typescript-eslint/no-explicit-any */
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import UserRepository from "@/app/repositories/user/userRepository";
import bcrypt from "bcryptjs";

class UserController {
  // ✅ Read all User receives
  async readAll(status, excludeRole = null) {
    try {
      const users = await UserRepository.readAll(status, excludeRole);
      const nextId = await UserRepository.readNextId();
      return successResponse({ users, nextId }, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get User receives in Method: UserController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  // ✅ Create new User receive
  async create(req) {
    try {
      const { req_object } =
        await req.json();

      console.log({ req_object });


      if (
        !req_object.email ||
        !req_object.password ||
        !req_object.role ||
        !req_object.user_nam
      ) {
        const error = new Error(
          "email, password, role, user_nam are required"
        );
        ErrorLogger.log(
          "Failed to create User receive in Method: UserController.create",
          error
        );
        return errorResponse(error, 400);
      }

      const hashedPassword = await bcrypt.hash(req_object.password, 10);

      const user = await UserRepository.create(
        { ...req_object, password: hashedPassword }
      );

      return successResponse(
        { user },
        `User created successfully with "${req_object.role}" role`
      );
    } catch (err) {
      if (err.code === "P2002") {
        ErrorLogger.log(
          "Duplicate user during create in Method: UserController.create",
          err
        );
        return errorResponse(
          new Error("User receive with this token already exists"),
          400
        );
      }
      if (err.code === "P2003") {
        ErrorLogger.log(
          "Foreign key constraint failed in Method: UserController.create",
          err
        );
        return errorResponse(new Error("Invalid token_id provided"), 400);
      }
      ErrorLogger.log(
        "Failed to create User receive in Method: UserController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  // ✅ Update User receive
  async update(req) {
    try {
      const { req_object } =
        await req.json();
      const { user_id } = req_object;

      if (!user_id) {
        const error = new Error("user_id is required");
        ErrorLogger.log(
          "Failed to update User receive in Method: UserController.update",
          error
        );
        return errorResponse(error, 400);
      }

      // If password is provided, hash it; otherwise, don't include it in the update
      const updateData = { ...req_object };
      if (updateData.password && updateData.password.trim() !== "") {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      } else {
        // Remove password from update if not provided
        delete updateData.password;
      }

      const updated = await UserRepository.update(
        user_id,
        updateData
      );
      return successResponse(
        { user_id: updated.user_id },
        "User updated successfully"
      );
    } catch (err) {
      if (err.code === "P2002") {
        ErrorLogger.log(
          "Duplicate entry during update in Method: UserController.update",
          err
        );
        return errorResponse(new Error("Duplicate entry exists"), 400);
      }
      if (err.code === "P2025") {
        ErrorLogger.log(
          "User not found during update in Method: UserController.update",
          err
        );
        return errorResponse(new Error("User receive not found"), 404);
      }
      if (err.code === "P2003") {
        ErrorLogger.log(
          "Foreign key constraint failed in Method: UserController.update",
          err
        );
        return errorResponse(new Error("Invalid token_id provided"), 400);
      }
      ErrorLogger.log(
        "Failed to update User in Method: UserController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }

  // ✅ Update status
  async updateStatus(req) {
    try {
      const { req_object } =
        await req.json();
      const { user_id, status } = req_object;

      console.log("Updating User:", user_id, "Status:", status);

      if (!user_id || typeof status !== "number") {
        const error = new Error("user_id and valid status are required");
        ErrorLogger.log(
          "Failed to update User in Method: UserController.updateStatus",
          error
        );
        return errorResponse(error, 400);
      }

      const updated = await UserRepository.updateStatus(
        user_id,
        status
      );

      return successResponse(
        { user_id: updated.user_id },
        "User status updated successfully"
      );
    } catch (error) {
      ErrorLogger.log("Error in UserController.updateStatus", error);
      return errorResponse(error, 500);
    }
  }

  // ✅ Read User receive by ID
  async readById(req) {
    try {
      const { searchParams } = new URL(req.url);
      const user_id = searchParams.get("user_id");

      if (!user_id) {
        const error = new Error("user_id is required");
        ErrorLogger.log(
          "Failed to get User by id in Method: UserController.readById",
          error
        );
        return errorResponse(error, 400);
      }

      const rawStoneReceive = await UserRepository.readById(user_id);
      return successResponse(rawStoneReceive, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get User by id in Method: UserController.readById",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new UserController();
