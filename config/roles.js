
import { Role } from "@prisma/client";

export const roleBasedRoutes = {
    "/": [Role.SUPER_ADMIN, Role.ADMIN, Role.USER],
    "/accounts": [Role.SUPER_ADMIN, Role.ADMIN],
    "/reports": [Role.SUPER_ADMIN, Role.ADMIN],
    "/sale": [Role.SUPER_ADMIN, Role.ADMIN],
    "/user_management": [Role.SUPER_ADMIN, Role.ADMIN],
};

