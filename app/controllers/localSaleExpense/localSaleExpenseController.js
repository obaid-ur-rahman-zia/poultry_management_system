import LocalSaleExpenseRepository from "@/app/repositories/localSaleExpense/localSaleExpenseRepository";
import LocalSaleExpenseSubheadRepository from "@/app/repositories/localSaleExpense/localSaleExpenseSubheadRepository";
import LocalSaleExpenseAccountRepository from "@/app/repositories/localSaleExpense/localSaleExpenseAccountRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import UserRepository from "@/app/repositories/user/userRepository";
import { recalculateAndWriteLocalSaleCash } from "@/app/services/localSale/localSaleCashService";
import prisma from "@/lib/prisma";

class LocalSaleExpenseController {
    // ─── SUBHEADS ──────────────────────────────────────────────────────────────
    async readAllSubheads(req) {
        try {
            const data = await LocalSaleExpenseSubheadRepository.readAll();
            return successResponse(data, "Success");
        } catch (err) {
            ErrorLogger.log("Failed to get local sale expense subheads", err);
            return errorResponse(err, 500);
        }
    }

    async createSubhead(req) {
        try {
            const { req_object } = await req.json();
            if (!req_object.subhead_nam) {
                return errorResponse(new Error("subhead_nam is required"), 400);
            }
            const data = await LocalSaleExpenseSubheadRepository.create(req_object);
            return successResponse(data, "Subhead created successfully");
        } catch (err) {
            ErrorLogger.log("Failed to create local sale expense subhead", err);
            return errorResponse(err, 500);
        }
    }

    async updateSubhead(req) {
        try {
            const { req_object } = await req.json();
            if (!req_object.ls_subhead_id) {
                return errorResponse(new Error("ls_subhead_id is required"), 400);
            }
            const data = await LocalSaleExpenseSubheadRepository.update(req_object.ls_subhead_id, req_object);
            return successResponse(data, "Subhead updated successfully");
        } catch (err) {
            ErrorLogger.log("Failed to update local sale expense subhead", err);
            return errorResponse(err, 500);
        }
    }

    async deleteSubhead(req) {
        try {
            const { searchParams } = new URL(req.url);
            const ls_subhead_id = searchParams.get("ls_subhead_id");
            if (!ls_subhead_id) {
                return errorResponse(new Error("ls_subhead_id is required"), 400);
            }
            const data = await LocalSaleExpenseSubheadRepository.delete(ls_subhead_id);
            return successResponse(data, "Subhead deleted successfully");
        } catch (err) {
            ErrorLogger.log("Failed to delete local sale expense subhead", err);
            return errorResponse(err, 500);
        }
    }

    // ─── ACCOUNTS ──────────────────────────────────────────────────────────────
    async readAllAccounts(req) {
        try {
            const { searchParams } = new URL(req.url);
            const ls_subhead_id = searchParams.get("ls_subhead_id");
            
            let data;
            if (ls_subhead_id) {
                data = await LocalSaleExpenseAccountRepository.readBySubhead(ls_subhead_id);
            } else {
                data = await LocalSaleExpenseAccountRepository.readAll();
            }
            return successResponse(data, "Success");
        } catch (err) {
            ErrorLogger.log("Failed to get local sale expense accounts", err);
            return errorResponse(err, 500);
        }
    }

    async createAccount(req) {
        try {
            const { req_object } = await req.json();
            if (!req_object.ls_subhead_id || !req_object.account_nam) {
                return errorResponse(new Error("ls_subhead_id and account_nam are required"), 400);
            }
            const data = await LocalSaleExpenseAccountRepository.create(req_object);
            return successResponse(data, "Account created successfully");
        } catch (err) {
            ErrorLogger.log("Failed to create local sale expense account", err);
            return errorResponse(err, 500);
        }
    }

    async updateAccount(req) {
        try {
            const { req_object } = await req.json();
            if (!req_object.ls_account_id) {
                return errorResponse(new Error("ls_account_id is required"), 400);
            }
            const data = await LocalSaleExpenseAccountRepository.update(req_object.ls_account_id, req_object);
            return successResponse(data, "Account updated successfully");
        } catch (err) {
            ErrorLogger.log("Failed to update local sale expense account", err);
            return errorResponse(err, 500);
        }
    }

    async deleteAccount(req) {
        try {
            const { searchParams } = new URL(req.url);
            const ls_account_id = searchParams.get("ls_account_id");
            if (!ls_account_id) {
                return errorResponse(new Error("ls_account_id is required"), 400);
            }
            const data = await LocalSaleExpenseAccountRepository.delete(ls_account_id);
            return successResponse(data, "Account deleted successfully");
        } catch (err) {
            ErrorLogger.log("Failed to delete local sale expense account", err);
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
            
            const page = parseInt(searchParams.get("page") || "1");
            const limit = parseInt(searchParams.get("limit") || "20");
            const skip = (page - 1) * limit;

            let data, total;
            if (getAll) {
                if (startDateParam && endDateParam) {
                    data = await LocalSaleExpenseRepository.readAllByDateRange(startDateParam, endDateParam);
                } else if (dateParam) {
                    data = await LocalSaleExpenseRepository.readAllByDate(dateParam);
                } else {
                    data = await LocalSaleExpenseRepository.readAll();
                }
                total = data.length;
                return successResponse({ data }, "Success");
            } else {
                const result = await LocalSaleExpenseRepository.readAllWithPagination(skip, limit);
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
            ErrorLogger.log("Failed to get local sale expenses", err);
            return errorResponse(err, 500);
        }
    }

    async readById(req) {
        try {
            const { searchParams } = new URL(req.url);
            const ls_expense_id = searchParams.get("ls_expense_id");

            if (!ls_expense_id) {
                return errorResponse(new Error("ls_expense_id is required"), 400);
            }

            const result = await LocalSaleExpenseRepository.readById(ls_expense_id);
            if (!result) {
                return errorResponse(new Error("Expense not found"), 404);
            }

            return successResponse(result, "Success");
        } catch (err) {
            ErrorLogger.log("Failed to get local sale expense by id", err);
            return errorResponse(err, 500);
        }
    }

    async create(req) {
        try {
            const session = await getServerSession(authOptions);
            const sessionUser = session?.user;

            if (!sessionUser) {
                return errorResponse(new Error("Unauthorized"), 401);
            }

            const userId = sessionUser.id?.toString();
            const user = await UserRepository.readById(userId);

            if (!user) {
                return errorResponse(new Error("User not found"), 404);
            }

            const bhagtanwalaCashAccount = await prisma.accounts.findFirst({
                where: { account_nam: "Cash Account (Bhagtanwala User)" },
            });

            if (!bhagtanwalaCashAccount) {
                return errorResponse(
                    new Error('Account "Cash Account (Bhagtanwala User)" not found'),
                    404,
                );
            }
            const cashInHandAccountId = bhagtanwalaCashAccount.acc_id;

            const bhagtanwalaUser = await prisma.user.findFirst({
                where: { email: "user@bhagtanwala.com" },
            });
            if (!bhagtanwalaUser) {
                return errorResponse(new Error('User "user@bhagtanwala.com" not found'), 404);
            }
            const bhagtanwalaUserId = bhagtanwalaUser.user_id.toString();

            const { req_object } = await req.json();
            const { ls_expense_date, ls_account_id, amount } = req_object;
            req_object.insert_by = req_object.insert_by || bhagtanwalaUserId;
            req_object.update_by = req_object.update_by || bhagtanwalaUserId;

            if (!ls_expense_date || !ls_account_id || !amount) {
                return errorResponse(new Error("ls_expense_date, ls_account_id, and amount are required"), 400);
            }

            if (parseFloat(amount) <= 0) {
                return errorResponse(new Error("Amount must be greater than 0"), 400);
            }

            const result = await prisma.$transaction(
                async (tx) => {
                    const created = await LocalSaleExpenseRepository.create(req_object, tx);
                    await recalculateAndWriteLocalSaleCash(created.ls_expense_date, cashInHandAccountId, tx);
                    return created;
                },
                { maxWait: 5000, timeout: 10000, isolationLevel: "Serializable" },
            );
            return successResponse({ ls_expense_id: result.ls_expense_id }, "Expense created successfully");
        } catch (err) {
            ErrorLogger.log("Failed to create local sale expense", err);
            return errorResponse(err, 500);
        }
    }

    async update(req) {
        try {
            const session = await getServerSession(authOptions);
            const sessionUser = session?.user;

            if (!sessionUser) {
                return errorResponse(new Error("Unauthorized"), 401);
            }

            const userId = sessionUser.id?.toString();
            const user = await UserRepository.readById(userId);

            if (!user) {
                return errorResponse(new Error("User not found"), 404);
            }

            const bhagtanwalaCashAccount = await prisma.accounts.findFirst({
                where: { account_nam: "Cash Account (Bhagtanwala User)" },
            });

            if (!bhagtanwalaCashAccount) {
                return errorResponse(
                    new Error('Account "Cash Account (Bhagtanwala User)" not found'),
                    404,
                );
            }
            const cashInHandAccountId = bhagtanwalaCashAccount.acc_id;

            const bhagtanwalaUser = await prisma.user.findFirst({
                where: { email: "user@bhagtanwala.com" },
            });
            if (!bhagtanwalaUser) {
                return errorResponse(new Error('User "user@bhagtanwala.com" not found'), 404);
            }
            const bhagtanwalaUserId = bhagtanwalaUser.user_id.toString();

            const { req_object } = await req.json();
            const { ls_expense_id } = req_object;
            req_object.update_by = req_object.update_by || bhagtanwalaUserId;

            if (!ls_expense_id) {
                return errorResponse(new Error("ls_expense_id is required"), 400);
            }

            const existing = await LocalSaleExpenseRepository.readById(ls_expense_id);
            if (!existing || existing.status === 0) {
                return errorResponse(new Error("Expense not found"), 404);
            }

            const result = await prisma.$transaction(
                async (tx) => {
                    const updated = await LocalSaleExpenseRepository.update(ls_expense_id, req_object, tx);
                    await recalculateAndWriteLocalSaleCash(updated.ls_expense_date, cashInHandAccountId, tx);

                    const oldDate = new Date(existing.ls_expense_date).toISOString().split("T")[0];
                    const newDate = new Date(updated.ls_expense_date).toISOString().split("T")[0];
                    if (oldDate !== newDate) {
                        await recalculateAndWriteLocalSaleCash(oldDate, cashInHandAccountId, tx);
                    }
                    return updated;
                },
                { maxWait: 5000, timeout: 10000, isolationLevel: "Serializable" },
            );
            return successResponse(result, "Expense updated successfully");
        } catch (err) {
            ErrorLogger.log("Failed to update local sale expense", err);
            return errorResponse(err, 500);
        }
    }

    async delete(req) {
        try {
            const session = await getServerSession(authOptions);
            const sessionUser = session?.user;

            if (!sessionUser) {
                return errorResponse(new Error("Unauthorized"), 401);
            }

            const userId = sessionUser.id?.toString();
            const user = await UserRepository.readById(userId);

            if (!user) {
                return errorResponse(new Error("User not found"), 404);
            }

            const bhagtanwalaCashAccount = await prisma.accounts.findFirst({
                where: { account_nam: "Cash Account (Bhagtanwala User)" },
            });

            if (!bhagtanwalaCashAccount) {
                return errorResponse(
                    new Error('Account "Cash Account (Bhagtanwala User)" not found'),
                    404,
                );
            }
            const cashInHandAccountId = bhagtanwalaCashAccount.acc_id;

            const { searchParams } = new URL(req.url);
            const ls_expense_id = searchParams.get("ls_expense_id");

            if (!ls_expense_id) {
                return errorResponse(new Error("ls_expense_id is required"), 400);
            }

            const existing = await LocalSaleExpenseRepository.readById(ls_expense_id);
            if (!existing || existing.status === 0) {
                return errorResponse(new Error("Expense not found"), 404);
            }

            let originalCashAccountId = cashInHandAccountId;
            const originalCreatorId = parseInt(existing.insert_by);
            if (!isNaN(originalCreatorId)) {
                const originalUser = await UserRepository.readById(originalCreatorId);
                if (originalUser && originalUser.cash_in_hand_account_id) {
                    originalCashAccountId = originalUser.cash_in_hand_account_id;
                }
            }

            await prisma.$transaction(
                async (tx) => {
                    await LocalSaleExpenseRepository.delete(ls_expense_id, tx);
                    await recalculateAndWriteLocalSaleCash(existing.ls_expense_date, originalCashAccountId, tx);
                },
                { maxWait: 5000, timeout: 10000, isolationLevel: "Serializable" },
            );
            return successResponse({}, "Expense deleted successfully");
        } catch (err) {
            ErrorLogger.log("Failed to delete local sale expense", err);
            return errorResponse(err, 500);
        }
    }
}

export default new LocalSaleExpenseController();
