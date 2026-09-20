import ShopExpenseRepository from "@/app/repositories/shopExpense/shopExpenseRepository";
import ShopExpenseSubheadRepository from "@/app/repositories/shopExpense/shopExpenseSubheadRepository";
import ShopExpenseAccountRepository from "@/app/repositories/shopExpense/shopExpenseAccountRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";

class ShopExpenseController {
    // ─── SUBHEADS ──────────────────────────────────────────────────────────────
    async readAllSubheads(req) {
        try {
            const data = await ShopExpenseSubheadRepository.readAll();
            return successResponse(data, "Success");
        } catch (err) {
            ErrorLogger.log("Failed to get shop expense subheads", err);
            return errorResponse(err, 500);
        }
    }

    async createSubhead(req) {
        try {
            const { req_object } = await req.json();
            if (!req_object.subhead_nam) {
                return errorResponse(new Error("subhead_nam is required"), 400);
            }
            const data = await ShopExpenseSubheadRepository.create(req_object);
            return successResponse(data, "Subhead created successfully");
        } catch (err) {
            ErrorLogger.log("Failed to create shop expense subhead", err);
            return errorResponse(err, 500);
        }
    }

    async updateSubhead(req) {
        try {
            const { req_object } = await req.json();
            if (!req_object.shop_subhead_id) {
                return errorResponse(new Error("shop_subhead_id is required"), 400);
            }
            const data = await ShopExpenseSubheadRepository.update(req_object.shop_subhead_id, req_object);
            return successResponse(data, "Subhead updated successfully");
        } catch (err) {
            ErrorLogger.log("Failed to update shop expense subhead", err);
            return errorResponse(err, 500);
        }
    }

    async deleteSubhead(req) {
        try {
            const { searchParams } = new URL(req.url);
            const shop_subhead_id = searchParams.get("shop_subhead_id");
            if (!shop_subhead_id) {
                return errorResponse(new Error("shop_subhead_id is required"), 400);
            }
            const data = await ShopExpenseSubheadRepository.delete(shop_subhead_id);
            return successResponse(data, "Subhead deleted successfully");
        } catch (err) {
            ErrorLogger.log("Failed to delete shop expense subhead", err);
            return errorResponse(err, 500);
        }
    }

    // ─── ACCOUNTS ──────────────────────────────────────────────────────────────
    async readAllAccounts(req) {
        try {
            const { searchParams } = new URL(req.url);
            const shop_subhead_id = searchParams.get("shop_subhead_id");
            
            let data;
            if (shop_subhead_id) {
                data = await ShopExpenseAccountRepository.readBySubhead(shop_subhead_id);
            } else {
                data = await ShopExpenseAccountRepository.readAll();
            }
            return successResponse(data, "Success");
        } catch (err) {
            ErrorLogger.log("Failed to get shop expense accounts", err);
            return errorResponse(err, 500);
        }
    }

    async createAccount(req) {
        try {
            const { req_object } = await req.json();
            if (!req_object.shop_subhead_id || !req_object.account_nam) {
                return errorResponse(new Error("shop_subhead_id and account_nam are required"), 400);
            }
            const data = await ShopExpenseAccountRepository.create(req_object);
            return successResponse(data, "Account created successfully");
        } catch (err) {
            ErrorLogger.log("Failed to create shop expense account", err);
            return errorResponse(err, 500);
        }
    }

    async updateAccount(req) {
        try {
            const { req_object } = await req.json();
            if (!req_object.shop_account_id) {
                return errorResponse(new Error("shop_account_id is required"), 400);
            }
            const data = await ShopExpenseAccountRepository.update(req_object.shop_account_id, req_object);
            return successResponse(data, "Account updated successfully");
        } catch (err) {
            ErrorLogger.log("Failed to update shop expense account", err);
            return errorResponse(err, 500);
        }
    }

    async deleteAccount(req) {
        try {
            const { searchParams } = new URL(req.url);
            const shop_account_id = searchParams.get("shop_account_id");
            if (!shop_account_id) {
                return errorResponse(new Error("shop_account_id is required"), 400);
            }
            const data = await ShopExpenseAccountRepository.delete(shop_account_id);
            return successResponse(data, "Account deleted successfully");
        } catch (err) {
            ErrorLogger.log("Failed to delete shop expense account", err);
            return errorResponse(err, 500);
        }
    }

    // ─── EXPENSES ──────────────────────────────────────────────────────────────
    async readAll(req) {
        try {
            const searchParams = req?.nextUrl?.searchParams || new URL(req?.url || "").searchParams;

            const getAll = searchParams.get("all") === "true";
            const dateParam = searchParams.get("date") || "";
            const startDateParam = searchParams.get("start_dat") || "";
            const endDateParam = searchParams.get("end_dat") || "";
            const shopAccId = searchParams.get("shop_acc_id") || null;
            
            const page = parseInt(searchParams.get("page") || "1");
            const limit = parseInt(searchParams.get("limit") || "20");
            const skip = (page - 1) * limit;

            let data, total;
            if (getAll) {
                if (startDateParam && endDateParam) {
                    data = await ShopExpenseRepository.readAllByDateRange(startDateParam, endDateParam, null, shopAccId);
                } else if (dateParam) {
                    data = await ShopExpenseRepository.readAllByDate(dateParam, null, shopAccId);
                } else {
                    data = await ShopExpenseRepository.readAll(null, shopAccId);
                }
                total = data.length;
                return successResponse({ data }, "Success");
            } else {
                const result = await ShopExpenseRepository.readAllWithPagination(skip, limit, null, shopAccId);
                data = result.data;
                total = result.total;
            }

            return successResponse(
                {
                    data,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                    },
                },
                "Success",
            );
        } catch (err) {
            ErrorLogger.log("Failed to get shop expenses", err);
            return errorResponse(err, 500);
        }
    }

    async readById(req) {
        try {
            const { searchParams } = new URL(req.url);
            const shop_expense_id = searchParams.get("shop_expense_id");

            if (!shop_expense_id) {
                return errorResponse(new Error("shop_expense_id is required"), 400);
            }

            const result = await ShopExpenseRepository.readById(shop_expense_id);
            if (!result) {
                return errorResponse(new Error("Expense not found"), 404);
            }

            return successResponse(result, "Success");
        } catch (err) {
            ErrorLogger.log("Failed to get shop expense by id", err);
            return errorResponse(err, 500);
        }
    }

    async create(req) {
        try {
            const { req_object } = await req.json();
            const { shop_expense_date, shop_acc_id, shop_account_id, amount } = req_object;

            if (!shop_expense_date || !shop_acc_id || !shop_account_id || !amount) {
                return errorResponse(new Error("shop_expense_date, shop_acc_id, shop_account_id, and amount are required"), 400);
            }

            if (parseFloat(amount) <= 0) {
                return errorResponse(new Error("Amount must be greater than 0"), 400);
            }

            const result = await ShopExpenseRepository.create(req_object);
            return successResponse({ shop_expense_id: result.shop_expense_id }, "Expense created successfully");
        } catch (err) {
            ErrorLogger.log("Failed to create shop expense", err);
            return errorResponse(err, 500);
        }
    }

    async update(req) {
        try {
            const { req_object } = await req.json();
            const { shop_expense_id } = req_object;

            if (!shop_expense_id) {
                return errorResponse(new Error("shop_expense_id is required"), 400);
            }

            const result = await ShopExpenseRepository.update(shop_expense_id, req_object);
            return successResponse(result, "Expense updated successfully");
        } catch (err) {
            ErrorLogger.log("Failed to update shop expense", err);
            return errorResponse(err, 500);
        }
    }

    async delete(req) {
        try {
            const { searchParams } = new URL(req.url);
            const shop_expense_id = searchParams.get("shop_expense_id");

            if (!shop_expense_id) {
                return errorResponse(new Error("shop_expense_id is required"), 400);
            }

            await ShopExpenseRepository.delete(shop_expense_id);
            return successResponse({}, "Expense deleted successfully");
        } catch (err) {
            ErrorLogger.log("Failed to delete shop expense", err);
            return errorResponse(err, 500);
        }
    }
}

export default new ShopExpenseController();
