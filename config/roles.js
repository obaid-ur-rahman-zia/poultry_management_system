
import { Role } from "@prisma/client";

export const roleBasedRoutes = {
    "/": [Role.SUPER_ADMIN, Role.ADMIN, Role.USER],
    "/account": [Role.SUPER_ADMIN, Role.ADMIN],
    "/sale": [Role.SUPER_ADMIN, Role.ADMIN],
    "/purchase": [Role.SUPER_ADMIN, Role.ADMIN],
    "/expense": [Role.SUPER_ADMIN, Role.ADMIN],
    "/expense-head": [Role.SUPER_ADMIN, Role.ADMIN, Role.USER],
    "/reports": [Role.SUPER_ADMIN, Role.ADMIN],
    "/flock": [Role.SUPER_ADMIN, Role.ADMIN],
    "/farm-reports": [Role.SUPER_ADMIN, Role.ADMIN],
    "/add-product": [Role.SUPER_ADMIN, Role.ADMIN],
    "/add-unit": [Role.SUPER_ADMIN, Role.ADMIN],
    "/floc-management": [Role.SUPER_ADMIN, Role.ADMIN],
    "/unit-expense": [Role.SUPER_ADMIN, Role.ADMIN],
    "/unit-income": [Role.SUPER_ADMIN, Role.ADMIN],
    "/trading": [Role.SUPER_ADMIN, Role.ADMIN],
    "/user_management": [Role.SUPER_ADMIN, Role.ADMIN],
    "/whole-sale": [Role.SUPER_ADMIN, Role.ADMIN],
    "/whole-sale-reports": [Role.SUPER_ADMIN, Role.ADMIN],
    "/pos": [Role.SUPER_ADMIN, Role.ADMIN],
};

