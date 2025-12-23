import AccountsRepository from "@/app/repositories/account/accounts/accountsRepository";
import AccountSubHeadRepository from "@/app/repositories/account/accountSubHead/accountSubHeadRepository";
import TransactionRepository from "@/app/repositories/transaction/transactionRepository";
import UserRepository from "@/app/repositories/user/userRepository";
import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import RedisService from "@/app/utils/redis";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

class AccountsController {
  async readAll() {
    const cacheKey = "accounts:all";
    try {
      // Get logged-in user session
      const session = await getServerSession(authOptions);
      let userCashInHandAccountId = null;

      if (session && session.user?.id) {
        const userId = parseInt(session.user.id);
        const user = await UserRepository.readById(userId);
        if (user && user.cash_in_hand_account_id) {
          userCashInHandAccountId = user.cash_in_hand_account_id;
        }
      }

      // Find "Cash In Hand" subhead
      const cashInHandSubhead = await AccountSubHeadRepository.findByName(
        "Cash In Hand"
      );
      const cashInHandSubId = cashInHandSubhead?.sub_id || null;

      // Get all accounts
      const allAccounts = await AccountsRepository.readAll();

      // Filter accounts based on user's cash in hand account
      let filteredAccounts = allAccounts;

      if (userCashInHandAccountId && cashInHandSubId) {
        // filteredAccounts = allAccounts.filter((account) => {
        //   // If account is from "Cash In Hand" subhead, only show user's cash in hand account
        //   if (account.sub_id === cashInHandSubId) {
        //     return account.acc_id === userCashInHandAccountId;
        //   }
        //   // For all other subheads, show all accounts
        //   return true;
        // });

        filteredAccounts = allAccounts;
      }

      // Use cache key with user ID to avoid cache conflicts
      const userCacheKey = userCashInHandAccountId
        ? `accounts:all:user:${userCashInHandAccountId}`
        : cacheKey;

      const cachedData = await RedisService.get(userCacheKey);
      if (cachedData) {
        console.log("Account Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Account Cache Miss");

      await RedisService.setex(
        userCacheKey,
        300,
        JSON.stringify(filteredAccounts)
      );
      return successResponse(filteredAccounts, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get all accounts in Method: AccountsController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readByHead(req) {
    try {
      const { searchParams } = new URL(req.url);
      const head_id = searchParams.get("head_id");

      if (!head_id) {
        const error = new Error("Missing head_id");
        ErrorLogger.log(
          "Failed to get accounts by head in Method: AccountsController.readByHead",
          error
        );
        return errorResponse(error, 400);
      }

      const data = await AccountsRepository.readByHead(head_id);
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get accounts by head in Method: AccountsController.readByHead",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readBySubHead(req) {
    try {
      const { searchParams } = new URL(req.url);
      const sub_id = searchParams.get("sub_id");

      if (!sub_id) {
        const error = new Error("sub_id is required");
        ErrorLogger.log(
          "Failed to get accounts by subhead in Method: AccountsController.readBySubHead",
          error
        );
        return errorResponse(error, 400);
      }

      // Get logged-in user session
      const session = await getServerSession(authOptions);
      let userCashInHandAccountId = null;

      if (session && session.user?.id) {
        const userId = parseInt(session.user.id);
        const user = await UserRepository.readById(userId);
        if (user && user.cash_in_hand_account_id) {
          userCashInHandAccountId = user.cash_in_hand_account_id;
        }
      }

      // Find "Cash In Hand" subhead
      const cashInHandSubhead = await AccountSubHeadRepository.findByName(
        "Cash In Hand"
      );
      const cashInHandSubId = cashInHandSubhead?.sub_id || null;

      // Get all accounts for this subhead
      const allAccounts = await AccountsRepository.readBySubHead(sub_id);

      // Filter accounts if this is "Cash In Hand" subhead
      let filteredAccounts = allAccounts;

      if (
        userCashInHandAccountId &&
        cashInHandSubId &&
        parseInt(sub_id) === cashInHandSubId
      ) {
        // Only show user's cash in hand account for "Cash In Hand" subhead
        filteredAccounts = allAccounts.filter(
          (account) => account.acc_id === userCashInHandAccountId
        );
      }
      // For all other subheads, show all accounts (no filtering needed)

      return successResponse(filteredAccounts, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get accounts by subhead in Method: AccountsController.readBySubHead",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readById(req) {
    try {
      const { searchParams } = new URL(req.url);
      const acc_id = searchParams.get("acc_id");

      if (!acc_id) {
        const error = new Error("acc_id is required");
        ErrorLogger.log(
          "Failed to get account by id in Method: AccountsController.readById",
          error
        );
        return errorResponse(error, 400);
      }

      const result = await AccountsRepository.readById(acc_id);
      if (!result) {
        ErrorLogger.log(
          "Failed to get account by id in Method: AccountsController.readById",
          new Error("Account not found")
        );
        return errorResponse(new Error("Account not found"), 404);
      }

      return successResponse(result, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get account by id in Method: AccountsController.readById",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async create(req) {
    try {
      const { req_object } = await req.json();
      const { head_id, sub_id, account_nam } = req_object;

      if (!head_id || !sub_id || !account_nam) {
        const error = new Error(
          "head_id, sub_id, account_nam are required in Method: AccountsController.create"
        );
        return errorResponse(error, 400);
      }

      // Check for duplicate account name with same account type (sub_id)
      const duplicate = await AccountsRepository.checkDuplicate(
        account_nam,
        sub_id
      );
      if (duplicate) {
        const error = new Error(
          "An account with this name already exists for this account type"
        );
        ErrorLogger.log(
          "Failed to create account - duplicate name and type in Method: AccountsController.create",
          error
        );
        return errorResponse(error, 400);
      }

      // Use transaction to ensure both account and transaction are created together
      const result = await prisma.$transaction(async (tx) => {
        const createdAccount = await AccountsRepository.create(
          {
            head_id,
            sub_id,
            account_nam: account_nam.trim(),
            account_contact: req_object.account_contact,
            account_address: req_object.account_address,
            account_reference: req_object.account_reference,
            account_cnic: req_object.account_cnic,
            account_alter_nam: req_object.account_alter_nam,
            account_no: req_object.account_no,
            insert_by: req_object.insert_by,
            update_by: req_object.update_by,
            status: req_object.status,
          },
          tx
        );

        // Create double-entry transactions if opening balance is provided and not zero
        const openingBalance = req_object.opening_balance;
        const balanceType = req_object.balance_type || "credit"; // "debit" or "credit"

        if (
          openingBalance !== undefined &&
          openingBalance !== null &&
          openingBalance !== 0
        ) {
          const absoluteBalance = Math.abs(openingBalance);
          const isDebit = balanceType === "debit";

          // Find or create "Opening Balance" account
          // First, find the "Opening Balance" subhead (or create if needed)
          let openingBalanceSubhead = await AccountSubHeadRepository.findByName(
            "Opening Balance"
          );
          let openingBalanceAccount = null;

          if (!openingBalanceSubhead) {
            // Get the first head_id (usually 1 for "Main Head")
            const firstHead = await tx.account_head.findFirst({
              orderBy: { head_id: "asc" },
            });

            if (firstHead) {
              // Create Opening Balance subhead
              const maxSubhead = await tx.account_sub_head.findFirst({
                where: { head_id: firstHead.head_id },
                orderBy: { subhead_id: "desc" },
                select: { subhead_id: true },
              });
              const nextSubheadId = maxSubhead ? maxSubhead.subhead_id + 1 : 1;

              openingBalanceSubhead = await tx.account_sub_head.create({
                data: {
                  head_id: firstHead.head_id,
                  subhead_id: nextSubheadId,
                  subhead_nam: "Opening Balance",
                  is_parent: 0,
                  parent_sub_id: null,
                  insert_by: "system",
                  update_by: "system",
                  status: 1,
                },
              });
            }
          }

          if (openingBalanceSubhead) {
            // Find or create Opening Balance account
            openingBalanceAccount =
              await AccountsRepository.findOrCreateByAccountNameAndSubheadName(
                "Opening Balance",
                "Opening Balance",
                openingBalanceSubhead.head_id,
                openingBalanceSubhead.sub_id,
                tx
              );
          }

          if (openingBalanceAccount) {
            // Transaction 1: Opening Balance account
            await TransactionRepository.create(
              {
                acc_id: openingBalanceAccount.acc_id,
                reference_id: createdAccount.acc_id,
                reference: "Opening Balance",
                debit: isDebit ? absoluteBalance : 0,
                credit: isDebit ? 0 : absoluteBalance,
                remarks: `Opening balance for account: ${account_nam.trim()}`,
                financial_year: new Date().getFullYear().toString(),
                voucher_type: "Opening Balance",
                insert_by: req_object.insert_by || "user 1",
                update_by: req_object.update_by || "user 1",
              },
              tx
            );

            // Transaction 2: New account (inverse)
            await TransactionRepository.create(
              {
                acc_id: createdAccount.acc_id,
                reference_id: createdAccount.acc_id,
                reference: "Opening Balance",
                debit: isDebit ? 0 : absoluteBalance,
                credit: isDebit ? absoluteBalance : 0,
                remarks: `Opening balance for account: ${account_nam.trim()}`,
                financial_year: new Date().getFullYear().toString(),
                voucher_type: "Opening Balance",
                insert_by: req_object.insert_by || "user 1",
                update_by: req_object.update_by || "user 1",
              },
              tx
            );
          } else {
            // Fallback: Create single transaction if Opening Balance account not found/created
            await TransactionRepository.create(
              {
                acc_id: createdAccount.acc_id,
                reference_id: createdAccount.acc_id,
                reference: "Opening Balance",
                debit: isDebit ? absoluteBalance : 0,
                credit: isDebit ? 0 : absoluteBalance,
                remarks: `Opening balance for account: ${account_nam.trim()}`,
                financial_year: new Date().getFullYear().toString(),
                voucher_type: "Opening Balance",
                insert_by: req_object.insert_by || "user 1",
                update_by: req_object.update_by || "user 1",
              },
              tx
            );
          }
        }

        return createdAccount;
      });

      await RedisService.del("accounts:all");
      await RedisService.del("transactions:all");
      return successResponse(
        {
          acc_id: result.acc_id,
          account_id: result.account_id,
        },
        "Account created successfully"
      );
    } catch (err) {
      if (err.code === "P2002") {
        return errorResponse(
          new Error(
            "Account with this combination already exists in Method: AccountsController.create"
          ),
          400
        );
      }
      if (err.code === "P2003") {
        return errorResponse(
          new Error(
            "Invalid head_id or sub_id - referenced records do not exist in Method: AccountsController.create"
          ),
          400
        );
      }
      ErrorLogger.log(
        "Failed to create account in Method: AccountsController.create",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { acc_id, account_nam } = req_object;

      if (!acc_id || !account_nam) {
        const error = new Error(
          "acc_id, account_nam, and account_string are required in Method: AccountsController.update"
        );
        return errorResponse(error, 400);
      }

      // Get current account to check sub_id if not provided in update
      const currentAccount = await AccountsRepository.readById(acc_id);
      if (!currentAccount) {
        const error = new Error("Account not found");
        ErrorLogger.log(
          "Failed to update account - account not found in Method: AccountsController.update",
          error
        );
        return errorResponse(error, 404);
      }

      // Use sub_id from request or current account
      const sub_id = req_object.sub_id || currentAccount.sub_id;

      // Check for duplicate account name with same account type (sub_id), excluding current account
      const duplicate = await AccountsRepository.checkDuplicate(
        account_nam,
        sub_id,
        acc_id
      );
      if (duplicate) {
        const error = new Error(
          "An account with this name already exists for this account type"
        );
        ErrorLogger.log(
          "Failed to update account - duplicate name and type in Method: AccountsController.update",
          error
        );
        return errorResponse(error, 400);
      }

      // Use transaction to ensure both account and transaction are updated together
      const result = await prisma.$transaction(async (tx) => {
        const updated = await AccountsRepository.update(acc_id, req_object, tx);

        // Handle opening balance transaction (double-entry)
        const openingBalance = req_object.opening_balance;
        const balanceType = req_object.balance_type || "credit";

        // Find existing opening balance transactions (both accounts)
        const existingAccountTransaction = await tx.transaction.findFirst({
          where: {
            acc_id: Number(acc_id),
            reference_id: Number(acc_id),
            reference: "Opening Balance",
            isDeleted: false,
          },
        });

        if (
          openingBalance !== undefined &&
          openingBalance !== null &&
          openingBalance !== 0
        ) {
          const absoluteBalance = Math.abs(openingBalance);
          const isDebit = balanceType === "debit";

          // Find or create "Opening Balance" account
          let openingBalanceSubhead = await AccountSubHeadRepository.findByName(
            "Opening Balance"
          );
          let openingBalanceAccount = null;

          if (!openingBalanceSubhead) {
            const firstHead = await tx.account_head.findFirst({
              orderBy: { head_id: "asc" },
            });

            if (firstHead) {
              const maxSubhead = await tx.account_sub_head.findFirst({
                where: { head_id: firstHead.head_id },
                orderBy: { subhead_id: "desc" },
                select: { subhead_id: true },
              });
              const nextSubheadId = maxSubhead ? maxSubhead.subhead_id + 1 : 1;

              openingBalanceSubhead = await tx.account_sub_head.create({
                data: {
                  head_id: firstHead.head_id,
                  subhead_id: nextSubheadId,
                  subhead_nam: "Opening Balance",
                  is_parent: 0,
                  parent_sub_id: null,
                  insert_by: "system",
                  update_by: "system",
                  status: 1,
                },
              });
            }
          }

          if (openingBalanceSubhead) {
            openingBalanceAccount =
              await AccountsRepository.findOrCreateByAccountNameAndSubheadName(
                "Opening Balance",
                "Opening Balance",
                openingBalanceSubhead.head_id,
                openingBalanceSubhead.sub_id,
                tx
              );
          }

          if (openingBalanceAccount) {
            // Find existing Opening Balance account transaction
            const existingOpeningBalanceTransaction =
              await tx.transaction.findFirst({
                where: {
                  acc_id: openingBalanceAccount.acc_id,
                  reference_id: Number(acc_id),
                  reference: "Opening Balance",
                  isDeleted: false,
                },
              });

            if (
              existingAccountTransaction &&
              existingOpeningBalanceTransaction
            ) {
              // Update both transactions
              await tx.transaction.update({
                where: { t_id: existingAccountTransaction.t_id },
                data: {
                  debit: isDebit ? 0 : absoluteBalance,
                  credit: isDebit ? absoluteBalance : 0,
                  remarks: `Opening balance for account: ${account_nam.trim()}`,
                  update_by: req_object.update_by || "user 1",
                },
              });

              await tx.transaction.update({
                where: { t_id: existingOpeningBalanceTransaction.t_id },
                data: {
                  debit: isDebit ? absoluteBalance : 0,
                  credit: isDebit ? 0 : absoluteBalance,
                  remarks: `Opening balance for account: ${account_nam.trim()}`,
                  update_by: req_object.update_by || "user 1",
                },
              });
            } else {
              // Delete old transactions if they exist
              if (existingAccountTransaction) {
                await tx.transaction.update({
                  where: { t_id: existingAccountTransaction.t_id },
                  data: { isDeleted: true },
                });
              }
              if (existingOpeningBalanceTransaction) {
                await tx.transaction.update({
                  where: { t_id: existingOpeningBalanceTransaction.t_id },
                  data: { isDeleted: true },
                });
              }

              // Create new double-entry transactions
              // Transaction 1: Opening Balance account
              await TransactionRepository.create(
                {
                  acc_id: openingBalanceAccount.acc_id,
                  reference_id: Number(acc_id),
                  reference: "Opening Balance",
                  debit: isDebit ? absoluteBalance : 0,
                  credit: isDebit ? 0 : absoluteBalance,
                  remarks: `Opening balance for account: ${account_nam.trim()}`,
                  financial_year: new Date().getFullYear().toString(),
                  voucher_type: "Opening Balance",
                  insert_by: req_object.update_by || "user 1",
                  update_by: req_object.update_by || "user 1",
                },
                tx
              );

              // Transaction 2: Account (inverse)
              await TransactionRepository.create(
                {
                  acc_id: Number(acc_id),
                  reference_id: Number(acc_id),
                  reference: "Opening Balance",
                  debit: isDebit ? 0 : absoluteBalance,
                  credit: isDebit ? absoluteBalance : 0,
                  remarks: `Opening balance for account: ${account_nam.trim()}`,
                  financial_year: new Date().getFullYear().toString(),
                  voucher_type: "Opening Balance",
                  insert_by: req_object.update_by || "user 1",
                  update_by: req_object.update_by || "user 1",
                },
                tx
              );
            }
          } else {
            // Fallback: Single transaction if Opening Balance account not found
            if (existingAccountTransaction) {
              await tx.transaction.update({
                where: { t_id: existingAccountTransaction.t_id },
                data: {
                  debit: isDebit ? absoluteBalance : 0,
                  credit: isDebit ? 0 : absoluteBalance,
                  remarks: `Opening balance for account: ${account_nam.trim()}`,
                  update_by: req_object.update_by || "user 1",
                },
              });
            } else {
              await TransactionRepository.create(
                {
                  acc_id: Number(acc_id),
                  reference_id: Number(acc_id),
                  reference: "Opening Balance",
                  debit: isDebit ? absoluteBalance : 0,
                  credit: isDebit ? 0 : absoluteBalance,
                  remarks: `Opening balance for account: ${account_nam.trim()}`,
                  financial_year: new Date().getFullYear().toString(),
                  voucher_type: "Opening Balance",
                  insert_by: req_object.update_by || "user 1",
                  update_by: req_object.update_by || "user 1",
                },
                tx
              );
            }
          }
        } else if (existingAccountTransaction) {
          // If opening balance is zero or not provided, delete both transactions
          await tx.transaction.update({
            where: { t_id: existingAccountTransaction.t_id },
            data: {
              isDeleted: true,
              update_by: req_object.update_by || "user 1",
            },
          });

          // Also delete the Opening Balance account transaction if exists
          const openingBalanceSubhead =
            await AccountSubHeadRepository.findByName("Opening Balance");
          if (openingBalanceSubhead) {
            const openingBalanceAccount =
              await AccountsRepository.findByAccountNameAndSubheadName(
                "Opening Balance",
                "Opening Balance",
                tx
              );

            if (openingBalanceAccount) {
              const existingOpeningBalanceTransaction =
                await tx.transaction.findFirst({
                  where: {
                    acc_id: openingBalanceAccount.acc_id,
                    reference_id: Number(acc_id),
                    reference: "Opening Balance",
                    isDeleted: false,
                  },
                });

              if (existingOpeningBalanceTransaction) {
                await tx.transaction.update({
                  where: { t_id: existingOpeningBalanceTransaction.t_id },
                  data: {
                    isDeleted: true,
                    update_by: req_object.update_by || "user 1",
                  },
                });
              }
            }
          }
        }

        return updated;
      });

      await RedisService.del("accounts:all");
      await RedisService.del("transactions:all");
      return successResponse(result, "Account updated successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to update account in Method: AccountsController.update",
          err
        );
        return errorResponse(new Error("Account not found"), 404);
      }
      ErrorLogger.log(
        "Failed to update account in Method: AccountsController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async delete(req) {
    try {
      const { searchParams } = new URL(req.url);
      const acc_id = searchParams.get("acc_id");

      if (!acc_id) {
        ErrorLogger.log(
          "Failed to delete account in Method: AccountsController.delete",
          new Error("acc_id is required")
        );
        return errorResponse(new Error("acc_id is required"), 400);
      }

      await AccountsRepository.delete(acc_id);
      return successResponse({}, "Account deleted successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to delete account in Method: AccountsController.delete",
          err
        );
        return errorResponse(new Error("Account not found"), 404);
      }
      ErrorLogger.log(
        "Failed to delete account in Method: AccountsController.delete",
        err
      );
      return errorResponse(err, 500);
    }
  }

  
}

export default new AccountsController();
