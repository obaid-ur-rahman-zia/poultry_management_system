import prisma from "@/lib/prisma";

class UserRepository {
    /**
     * Read all users
     * @param {number|null} status - Filter by status (1 = active, 0 = inactive)
     * @param {string|null} excludeRole - Role to exclude from results (e.g., "SUPER_ADMIN")
     */
    async readAll(status, excludeRole = null) {
        const whereCondition = {};
        
        // Add status filter if provided
        if (status !== null && status !== undefined) {
            whereCondition.status = Number(status);
        }
        
        // Exclude specific role if provided (e.g., exclude SUPER_ADMIN for ADMIN users)
        if (excludeRole) {
            whereCondition.role = {
                not: excludeRole
            };
            console.log("Excluding role:", excludeRole, "Where condition:", whereCondition); // Debug log
        }

        return prisma.user.findMany({
            where: whereCondition,
            orderBy: { user_id: "asc" },
        });
    }

    /**
     * Get next user_id for manual reference or display
     */
    async readNextId() {
        const maxId = await prisma.user.aggregate({
            _max: { user_id: true },
        });
        return (maxId._max.user_id || 0) + 1;
    }

    /**
     * Create a new raw stone receive record
     */
    async create(data) {
        return prisma.user.create({
            data: {
                user_nam: data.user_nam,
                email: data.email,
                password: data.password,
                role: data.role,
                profile_picture: data.profile_picture,
                phone: data.phone,
                address: data.address,

                status: data.status ?? 1,
            },
        });
    }

    /**
     * Update an existing raw stone receive record
     */
    async update(user_id, data) {
        const updateData = {
            user_nam: data.user_nam,
            email: data.email,
            role: data.role,
            profile_picture: data.profile_picture,
            phone: data.phone,
            address: data.address,
            status: data.status ?? 1,
        };

        // Only update password if it's provided
        if (data.password) {
            updateData.password = data.password;
        }

        return prisma.user.update({
            where: { user_id },
            data: updateData,
        });
    }

    /**
     * Update status of raw stone receive
     */
    async updateStatus(user_id, status) {
        try {
            return await prisma.user.update({
                where: { user_id: Number(user_id) },
                data: { status },
            });
        } catch (error) {
            console.error("Error updating user status:", error);
            throw new Error("Failed to update user status");
        }
    }

    /**
     * Get a single raw stone receive by its ID
     */
    async readById(user_id) {
        return prisma.user.findUnique({
            where: { user_id: Number(user_id) },
        });
    }

    /**
     * Delete a raw stone receive (hard delete)
     */
    async delete(user_id) {
        return prisma.user.delete({
            where: { user_id },
        });
    }
}

export default new UserRepository();