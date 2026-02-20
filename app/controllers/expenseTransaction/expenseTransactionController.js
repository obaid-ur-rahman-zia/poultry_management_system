import ExpenseTransactionRepository from "@/app/repositories/expenseTransaction/expenseTransactionRepository";
import TransactionRepository from "@/app/repositories/transaction/transactionRepository";
import UserRepository from "@/app/repositories/user/userRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import prisma from "@/lib/prisma";
import { calculateFinancialYear } from "@/app/components/calculateFinYear/financialYear";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

class ExpenseTransactionController {
    // ─── READ ALL (paginated) ────────────────────────────────────────────────────
    async readAll(req) {
        try {
            const searchParams =
                req?.nextUrl?.searchParams || new URL(req?.url || "").searchParams;

            const getAll = searchParams.get("all") === "true";
            const page = parseInt(searchParams.get("page") || "1");
            const limit = parseInt(searchParams.get("limit") || "20");
            const skip = (page - 1) * limit;

            let data, total;
            if (getAll) {
                data = await ExpenseTransactionRepository.readAll();
                total = data.length;
                return successResponse({ data }, "Success");
            } else {
                const result = await ExpenseTransactionRepository.readAllWithPagination(
                    skip,
                    limit,
                );
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
            ErrorLogger.log(
                "Failed to get all expense transactions in Method: ExpenseTransactionController.readAll",
                err,
            );
            return errorResponse(err, 500);
        }
    }

    // ─── READ BY ID ──────────────────────────────────────────────────────────────
    async readById(req) {
        try {
            const { searchParams } = new URL(req.url);
            const expense_t_id = searchParams.get("expense_t_id");

            if (!expense_t_id) {
                const error = new Error("expense_t_id is required");
                ErrorLogger.log(
                    "Failed to get expense transaction by id in Method: ExpenseTransactionController.readById",
                    error,
                );
                return errorResponse(error, 400);
            }

            const result =
                await ExpenseTransactionRepository.readById(expense_t_id);
            if (!result) {
                return errorResponse(new Error("Expense transaction not found"), 404);
            }

            return successResponse(result, "Success");
        } catch (err) {
            ErrorLogger.log(
                "Failed to get expense transaction by id in Method: ExpenseTransactionController.readById",
                err,
            );
            return errorResponse(err, 500);
        }
    }

    // ─── CREATE ──────────────────────────────────────────────────────────────────
    async create(req) {
        try {
            // Auth
            const session = await getServerSession(authOptions);
            if (!session || !session.user?.id) {
                return errorResponse(
                    new Error("Unauthorized: User must be logged in"),
                    401,
                );
            }

            const userId = parseInt(session.user.id);
            const user = await UserRepository.readById(userId);
            if (!user) {
                return errorResponse(new Error("User not found"), 404);
            }

            if (!user.cash_in_hand_account || !user.cash_in_hand_account_id) {
                return errorResponse(
                    new Error(
                        "User must have a Cash In Hand account. Please contact administrator.",
                    ),
                    400,
                );
            }

            const { req_object } = await req.json();
            const { transaction_date, account_id, amount } = req_object;

            // Validate required fields
            if (!transaction_date || !account_id || !amount) {
                const error = new Error(
                    "transaction_date, account_id, and amount are required",
                );
                ErrorLogger.log(
                    "Failed to create expense transaction in Method: ExpenseTransactionController.create",
                    error,
                );
                return errorResponse(error, 400);
            }

            const amountValue = parseFloat(amount);
            if (amountValue <= 0) {
                const error = new Error("Amount must be greater than 0");
                ErrorLogger.log(
                    "Failed to create expense transaction in Method: ExpenseTransactionController.create",
                    error,
                );
                return errorResponse(error, 400);
            }

            const financialYear = calculateFinancialYear(transaction_date);
            const cashInHandAccountId = user.cash_in_hand_account_id;
            const insertBy = req_object.insert_by || session.user?.name || "user 1";
            const updateBy = req_object.update_by || session.user?.name || "user 1";

            // Prisma transaction — keep expense record + ledger entries atomic
            const result = await prisma.$transaction(async (tx) => {
                // 1. Create the expense_transaction record
                const created = await ExpenseTransactionRepository.create(
                    {
                        transaction_date,
                        account_id: Number(account_id),
                        amount: amountValue,
                        description: req_object.description || null,
                        insert_by: insertBy,
                        update_by: updateBy,
                        status: req_object.status ?? 1,
                    },
                    tx,
                );

                const remarks =
                    req_object.description ||
                    `Expense payment to account ${account_id}`;

                // 2. DEBIT the expense account (expense increases)
                await TransactionRepository.create(
                    {
                        acc_id: Number(account_id),
                        reference_id: created.expense_t_id,
                        reference: "Expense Transaction",
                        debit: amountValue,
                        credit: 0,
                        remarks,
                        financial_year: financialYear,
                        voucher_type: "ET",
                        transaction_dat: new Date(transaction_date),
                        insert_by: insertBy,
                        update_by: updateBy,
                    },
                    tx,
                );

                // 3. CREDIT the user's cash-in-hand account (cash goes out)
                await TransactionRepository.create(
                    {
                        acc_id: cashInHandAccountId,
                        reference_id: created.expense_t_id,
                        reference: "Expense Transaction",
                        debit: 0,
                        credit: amountValue,
                        remarks: `Cash paid for expense: ${remarks}`,
                        financial_year: financialYear,
                        voucher_type: "ET",
                        transaction_dat: new Date(transaction_date),
                        insert_by: insertBy,
                        update_by: updateBy,
                    },
                    tx,
                );

                return created;
            });

            return successResponse(
                { expense_t_id: result.expense_t_id },
                "Expense transaction created successfully",
            );
        } catch (err) {
            ErrorLogger.log(
                "Failed to create expense transaction in Method: ExpenseTransactionController.create",
                err,
            );
            return errorResponse(err, 500);
        }
    }

    // ─── UPDATE ──────────────────────────────────────────────────────────────────
    async update(req) {
        try {
            // Auth
            const session = await getServerSession(authOptions);
            if (!session || !session.user?.id) {
                return errorResponse(
                    new Error("Unauthorized: User must be logged in"),
                    401,
                );
            }

            const userId = parseInt(session.user.id);
            const user = await UserRepository.readById(userId);
            if (!user) {
                return errorResponse(new Error("User not found"), 404);
            }

            if (!user.cash_in_hand_account || !user.cash_in_hand_account_id) {
                return errorResponse(
                    new Error(
                        "User must have a Cash In Hand account. Please contact administrator.",
                    ),
                    400,
                );
            }

            const { req_object } = await req.json();
            const { expense_t_id } = req_object;

            if (!expense_t_id) {
                const error = new Error("expense_t_id is required");
                ErrorLogger.log(
                    "Failed to update expense transaction in Method: ExpenseTransactionController.update",
                    error,
                );
                return errorResponse(error, 400);
            }

            // Fetch existing record to fall back on unchanged fields
            const existing =
                await ExpenseTransactionRepository.readById(expense_t_id);
            if (!existing) {
                return errorResponse(
                    new Error("Expense transaction not found"),
                    404,
                );
            }

            const transactionDate =
                req_object.transaction_date || existing.expense_t_date;
            const accountId = req_object.account_id
                ? Number(req_object.account_id)
                : existing.account_id;
            const amountValue = req_object.amount
                ? parseFloat(req_object.amount)
                : existing.amount;
            const financialYear = calculateFinancialYear(transactionDate);
            const cashInHandAccountId = user.cash_in_hand_account_id;
            const updateBy = req_object.update_by || session.user?.name || "user 1";

            const result = await prisma.$transaction(async (tx) => {
                // 1. Update the expense_transaction record
                const updated = await ExpenseTransactionRepository.update(
                    expense_t_id,
                    {
                        ...req_object,
                        account_id: accountId,
                        amount: amountValue,
                        update_by: updateBy,
                    },
                    tx,
                );

                // 2. Soft-delete old ledger entries for this expense
                await TransactionRepository.softDeleteByReferenceId(
                    existing.expense_t_id,
                    "Expense Transaction",
                    tx,
                );

                const remarks =
                    req_object.description ||
                    existing.description ||
                    `Expense payment to account ${accountId}`;

                // 3. Recreate DEBIT on the expense account
                await TransactionRepository.create(
                    {
                        acc_id: accountId,
                        reference_id: updated.expense_t_id,
                        reference: "Expense Transaction",
                        debit: amountValue,
                        credit: 0,
                        remarks,
                        financial_year: financialYear,
                        voucher_type: "ET",
                        transaction_dat: new Date(transactionDate),
                        insert_by: updateBy,
                        update_by: updateBy,
                    },
                    tx,
                );

                // 4. Recreate CREDIT on the cash-in-hand account
                await TransactionRepository.create(
                    {
                        acc_id: cashInHandAccountId,
                        reference_id: updated.expense_t_id,
                        reference: "Expense Transaction",
                        debit: 0,
                        credit: amountValue,
                        remarks: `Cash paid for expense: ${remarks}`,
                        financial_year: financialYear,
                        voucher_type: "ET",
                        transaction_dat: new Date(transactionDate),
                        insert_by: updateBy,
                        update_by: updateBy,
                    },
                    tx,
                );

                return updated;
            });

            return successResponse(result, "Expense transaction updated successfully");
        } catch (err) {
            if (err.code === "P2025") {
                ErrorLogger.log(
                    "Failed to update expense transaction in Method: ExpenseTransactionController.update",
                    err,
                );
                return errorResponse(new Error("Expense transaction not found"), 404);
            }
            ErrorLogger.log(
                "Failed to update expense transaction in Method: ExpenseTransactionController.update",
                err,
            );
            return errorResponse(err, 500);
        }
    }

    // ─── DELETE ──────────────────────────────────────────────────────────────────
    async delete(req) {
        try {
            const { searchParams } = new URL(req.url);
            const expense_t_id = searchParams.get("expense_t_id");

            if (!expense_t_id) {
                ErrorLogger.log(
                    "Failed to delete expense transaction in Method: ExpenseTransactionController.delete",
                    new Error("expense_t_id is required"),
                );
                return errorResponse(new Error("expense_t_id is required"), 400);
            }

            // Fetch to confirm it exists before deleting ledger rows
            const existing =
                await ExpenseTransactionRepository.readById(expense_t_id);
            if (!existing) {
                return errorResponse(
                    new Error("Expense transaction not found"),
                    404,
                );
            }

            await prisma.$transaction(async (tx) => {
                // Soft-delete the expense record
                await ExpenseTransactionRepository.delete(expense_t_id);

                // Soft-delete the two ledger entries linked to this expense
                await TransactionRepository.softDeleteByReferenceId(
                    Number(expense_t_id),
                    "Expense Transaction",
                    tx,
                );
            });

            return successResponse({}, "Expense transaction deleted successfully");
        } catch (err) {
            if (err.code === "P2025") {
                ErrorLogger.log(
                    "Failed to delete expense transaction in Method: ExpenseTransactionController.delete",
                    err,
                );
                return errorResponse(new Error("Expense transaction not found"), 404);
            }
            ErrorLogger.log(
                "Failed to delete expense transaction in Method: ExpenseTransactionController.delete",
                err,
            );
            return errorResponse(err, 500);
        }
    }
}

export default new ExpenseTransactionController();
