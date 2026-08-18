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
  async readAll(req) {
    const cacheKey = "accounts:all";
    try {
      // Extract pagination params
      const searchParams =
        req?.nextUrl?.searchParams || new URL(req?.url || "").searchParams;
      const getAll = searchParams.get("all") === "true";
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "20");
      const skip = (page - 1) * limit;

      if (getAll) {
        const cachedData = await RedisService.get(cacheKey);
        if (cachedData) {
          console.log("Account Cache Hit");
          return successResponse(cachedData, "Success");
        }
        console.log("Account Cache Miss");
      }

      // If getAll is true, fetch all accounts without pagination
      let allAccounts, total;
      if (getAll) {
        allAccounts = await AccountsRepository.readAll();
        total = allAccounts.length;
      } else {
        // Get total count and paginated accounts
        const result = await AccountsRepository.readAllWithPagination(
          skip,
          limit,
        );
        allAccounts = result.data;
        total = result.total;
      }

      // If getAll, return all accounts without pagination structure
      if (getAll) {
        const response = {
          data: allAccounts,
        };
        await RedisService.setex(cacheKey, 300, JSON.stringify(response));
        return successResponse(response, "Success");
      }

      const paginatedResponse = {
        data: allAccounts,
        pagination: {
          page,
          limit,
          total: total,
          totalPages: Math.ceil(total / limit),
        },
      };

      // Do NOT cache paginated response
      return successResponse(paginatedResponse, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get all accounts in Method: AccountsController.readAll",
        err,
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
          error,
        );
        return errorResponse(error, 400);
      }

      const data = await AccountsRepository.readByHead(head_id);
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get accounts by head in Method: AccountsController.readByHead",
        err,
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
          error,
        );
        return errorResponse(error, 400);
      }

      // Get logged-in user session
      const session = await getServerSession(authOptions);
      let userCashInHandAccountId = null;

      if (session && session.user?.cashInHandAccountId) {
        userCashInHandAccountId = parseInt(session.user.cashInHandAccountId);
      }

      // Find "Cash In Hand" subhead
      const cashInHandSubhead =
        await AccountSubHeadRepository.findByName("Cash In Hand");
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
          (account) => account.acc_id === userCashInHandAccountId,
        );
      }
      // For all other subheads, show all accounts (no filtering needed)

      return successResponse(filteredAccounts, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get accounts by subhead in Method: AccountsController.readBySubHead",
        err,
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
          error,
        );
        return errorResponse(error, 400);
      }

      const result = await AccountsRepository.readById(acc_id);
      if (!result) {
        ErrorLogger.log(
          "Failed to get account by id in Method: AccountsController.readById",
          new Error("Account not found"),
        );
        return errorResponse(new Error("Account not found"), 404);
      }

      return successResponse(result, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get account by id in Method: AccountsController.readById",
        err,
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
          "head_id, sub_id, account_nam are required in Method: AccountsController.create",
        );
        return errorResponse(error, 400);
      }

      // Validate that head_id and sub_id exist
      const head = await prisma.account_head.findUnique({
        where: { head_id: Number(head_id) },
      });
      if (!head) {
        const error = new Error(
          `Invalid head_id: ${head_id} - Account head does not exist`,
        );
        ErrorLogger.log(
          "Failed to create account - invalid head_id in Method: AccountsController.create",
          error,
        );
        return errorResponse(error, 400);
      }

      const subhead = await prisma.account_sub_head.findUnique({
        where: { sub_id: Number(sub_id) },
      });
      if (!subhead) {
        const error = new Error(
          `Invalid sub_id: ${sub_id} - Account sub-head does not exist`,
        );
        ErrorLogger.log(
          "Failed to create account - invalid sub_id in Method: AccountsController.create",
          error,
        );
        return errorResponse(error, 400);
      }

      // Verify that subhead belongs to the specified head
      if (subhead.head_id !== Number(head_id)) {
        const error = new Error(
          `Invalid combination: sub_id ${sub_id} does not belong to head_id ${head_id}`,
        );
        ErrorLogger.log(
          "Failed to create account - head_id and sub_id mismatch in Method: AccountsController.create",
          error,
        );
        return errorResponse(error, 400);
      }

      // Check for duplicate account name with same account type (sub_id)
      const duplicate = await AccountsRepository.checkDuplicate(
        account_nam,
        sub_id,
      );
      if (duplicate) {
        const error = new Error(
          "An account with this name already exists for this account type",
        );
        ErrorLogger.log(
          "Failed to create account - duplicate name and type in Method: AccountsController.create",
          error,
        );
        return errorResponse(error, 400);
      }

      // Use transaction to ensure both account and transaction are created together
      const result = await prisma.$transaction(async (tx) => {
        // Get subhead to determine account type (already validated above, but fetch again in transaction)
        const subheadInTx = await tx.account_sub_head.findUnique({
          where: { sub_id: sub_id },
        });

        // Determine account type flags based on subhead name
        let is_supplier = 0;
        let is_customer = 0;
        let is_employee = 0;
        let is_driver = 0;
        let is_delivery_man = 0;
        let is_salesman = 0;

        if (subheadInTx) {
          const subheadName = subheadInTx.subhead_nam.toLowerCase().trim();
          console.log(
            "Subhead name:",
            subheadName,
            "Original:",
            subheadInTx.subhead_nam,
          );

          // Check for Former (Supplier)
          if (subheadName === "former" || subheadName.includes("former")) {
            is_supplier = 1;
            console.log("Setting is_supplier = 1 for Former subhead");
          }
          // Check for Purcher (Customer)
          else if (
            subheadName === "purcher" ||
            subheadName.includes("purcher")
          ) {
            is_customer = 1;
            console.log("Setting is_customer = 1 for Purcher subhead");
          }
          // Check for Customer
          else if (
            subheadName === "customer" ||
            subheadName.includes("customer")
          ) {
            is_customer = 1;
            console.log("Setting is_customer = 1 for Customer subhead");
          }
          // Check for Supplier
          else if (
            subheadName === "supplier" ||
            subheadName.includes("supplier")
          ) {
            is_supplier = 1;
            console.log("Setting is_supplier = 1 for Supplier subhead");
          }
          // Note: Employee, Driver, Delivery Man, Salesman types are typically set via designation

          console.log("Account type flags:", {
            is_supplier,
            is_customer,
            is_employee,
            is_driver,
            is_delivery_man,
            is_salesman,
          });
        }

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
            is_supplier,
            is_customer,
            is_employee,
            is_driver,
            is_delivery_man,
            is_salesman,
            insert_by: req_object.insert_by,
            update_by: req_object.update_by,
            status: req_object.status,
          },
          tx,
        );

        // Create double-entry transactions if opening balance is provided and not zero
        const openingBalance = req_object.opening_balance;
        // Determine balance type: if balance_type is provided, use it; otherwise infer from opening_balance sign
        // Negative opening_balance = credit scenario, Positive opening_balance = debit scenario
        let balanceType = req_object.balance_type;
        if (
          !balanceType &&
          openingBalance !== undefined &&
          openingBalance !== null
        ) {
          // Infer from sign: negative = credit, positive = debit
          balanceType = openingBalance < 0 ? "credit" : "debit";
        }
        balanceType = (balanceType || "credit").toLowerCase().trim(); // "debit" or "credit"

        console.log("Opening Balance Transaction - CREATE:");
        console.log("  openingBalance:", openingBalance);
        console.log("  balanceType (raw):", req_object.balance_type);
        console.log("  balanceType (inferred/used):", balanceType);

        if (
          openingBalance !== undefined &&
          openingBalance !== null &&
          openingBalance !== 0
        ) {
          const absoluteBalance = Math.abs(openingBalance);
          const isDebit = balanceType === "debit";

          console.log("  isDebit:", isDebit);
          console.log("  absoluteBalance:", absoluteBalance);

          console.log("  isDebit:", isDebit);
          console.log("  absoluteBalance:", absoluteBalance);

          // Find or create "Opening Balance" account
          // First, find the "Opening Balance" subhead (or create if needed)
          let openingBalanceSubhead =
            await AccountSubHeadRepository.findByName("Opening Balance");
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
                tx,
              );
          }

          if (openingBalanceAccount) {
            if (isDebit) {
              // Debit case: newAccount -> debit, openingBalance -> credit
              console.log("  Creating DEBIT transactions:");
              console.log(
                "    New Account:",
                createdAccount.acc_id,
                "- Debit:",
                absoluteBalance,
              );
              console.log(
                "    Opening Balance:",
                openingBalanceAccount.acc_id,
                "- Credit:",
                absoluteBalance,
              );

              // Transaction 1: New account (debit)
              await TransactionRepository.create(
                {
                  acc_id: createdAccount.acc_id,
                  reference_id: createdAccount.acc_id,
                  reference: "Opening Balance",
                  debit: absoluteBalance,
                  credit: 0,
                  remarks: `Opening balance for account: ${account_nam.trim()}`,
                  financial_year: new Date().getFullYear().toString(),
                  voucher_type: "OB",
                  insert_by: req_object.insert_by || "user 1",
                  update_by: req_object.update_by || "user 1",
                },
                tx,
              );

              // Transaction 2: Opening Balance account (credit)
              await TransactionRepository.create(
                {
                  acc_id: openingBalanceAccount.acc_id,
                  reference_id: createdAccount.acc_id,
                  reference: "Opening Balance",
                  debit: 0,
                  credit: absoluteBalance,
                  remarks: `Opening balance for account: ${account_nam.trim()}`,
                  financial_year: new Date().getFullYear().toString(),
                  voucher_type: "OB",
                  insert_by: req_object.insert_by || "user 1",
                  update_by: req_object.update_by || "user 1",
                },
                tx,
              );
            } else {
              // Credit case: openingBalance -> debit, newAccount -> credit
              console.log("  Creating CREDIT transactions:");
              console.log(
                "    Opening Balance:",
                openingBalanceAccount.acc_id,
                "- Debit:",
                absoluteBalance,
              );
              console.log(
                "    New Account:",
                createdAccount.acc_id,
                "- Credit:",
                absoluteBalance,
              );

              // Transaction 1: Opening Balance account (debit)
              await TransactionRepository.create(
                {
                  acc_id: openingBalanceAccount.acc_id,
                  reference_id: createdAccount.acc_id,
                  reference: "Opening Balance",
                  debit: absoluteBalance,
                  credit: 0,
                  remarks: `Opening balance for account: ${account_nam.trim()}`,
                  financial_year: new Date().getFullYear().toString(),
                  voucher_type: "OB",
                  insert_by: req_object.insert_by || "user 1",
                  update_by: req_object.update_by || "user 1",
                },
                tx,
              );

              // Transaction 2: New account (credit)
              await TransactionRepository.create(
                {
                  acc_id: createdAccount.acc_id,
                  reference_id: createdAccount.acc_id,
                  reference: "Opening Balance",
                  debit: 0,
                  credit: absoluteBalance,
                  remarks: `Opening balance for account: ${account_nam.trim()}`,
                  financial_year: new Date().getFullYear().toString(),
                  voucher_type: "OB",
                  insert_by: req_object.insert_by || "user 1",
                  update_by: req_object.update_by || "user 1",
                },
                tx,
              );
            }
          }
        }

        return createdAccount;
      });

      await RedisService.del("accounts:all");
      await RedisService.del("transactions:all");
      // Clear supplier and customer caches if account type is set
      if (result.is_supplier === 1) {
        await RedisService.del("suppliers:all");
      }
      if (result.is_customer === 1) {
        await RedisService.del("customers:all");
      }
      return successResponse(
        {
          acc_id: result.acc_id,
          account_id: result.account_id,
        },
        "Account created successfully",
      );
    } catch (err) {
      if (err.code === "P2002") {
        return errorResponse(
          new Error(
            "Account with this combination already exists in Method: AccountsController.create",
          ),
          400,
        );
      }
      if (err.code === "P2003") {
        return errorResponse(
          new Error(
            "Invalid head_id or sub_id - referenced records do not exist in Method: AccountsController.create",
          ),
          400,
        );
      }
      ErrorLogger.log(
        "Failed to create account in Method: AccountsController.create",
        err,
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
          "acc_id, account_nam, and account_string are required in Method: AccountsController.update",
        );
        return errorResponse(error, 400);
      }

      // Get current account to check sub_id if not provided in update
      const currentAccount = await AccountsRepository.readById(acc_id);
      if (!currentAccount) {
        const error = new Error("Account not found");
        ErrorLogger.log(
          "Failed to update account - account not found in Method: AccountsController.update",
          error,
        );
        return errorResponse(error, 404);
      }

      // Use sub_id and head_id from request or current account
      const sub_id = req_object.sub_id || currentAccount.sub_id;
      const head_id = req_object.head_id || currentAccount.head_id;

      // Validate head_id and sub_id if they are being changed
      if (req_object.head_id) {
        const head = await prisma.account_head.findUnique({
          where: { head_id: Number(head_id) },
        });
        if (!head) {
          const error = new Error(
            `Invalid head_id: ${head_id} - Account head does not exist`,
          );
          ErrorLogger.log(
            "Failed to update account - invalid head_id in Method: AccountsController.update",
            error,
          );
          return errorResponse(error, 400);
        }
      }

      if (req_object.sub_id) {
        const subhead = await prisma.account_sub_head.findUnique({
          where: { sub_id: Number(sub_id) },
        });
        if (!subhead) {
          const error = new Error(
            `Invalid sub_id: ${sub_id} - Account sub-head does not exist`,
          );
          ErrorLogger.log(
            "Failed to update account - invalid sub_id in Method: AccountsController.update",
            error,
          );
          return errorResponse(error, 400);
        }

        // Verify that subhead belongs to the specified head
        if (subhead.head_id !== Number(head_id)) {
          const error = new Error(
            `Invalid combination: sub_id ${sub_id} does not belong to head_id ${head_id}`,
          );
          ErrorLogger.log(
            "Failed to update account - head_id and sub_id mismatch in Method: AccountsController.update",
            error,
          );
          return errorResponse(error, 400);
        }
      }

      // Check for duplicate account name with same account type (sub_id), excluding current account
      const duplicate = await AccountsRepository.checkDuplicate(
        account_nam,
        sub_id,
        acc_id,
      );
      if (duplicate) {
        const error = new Error(
          "An account with this name already exists for this account type",
        );
        ErrorLogger.log(
          "Failed to update account - duplicate name and type in Method: AccountsController.update",
          error,
        );
        return errorResponse(error, 400);
      }

      // Use transaction to ensure both account and transaction are updated together
      const result = await prisma.$transaction(async (tx) => {
        // Get subhead to determine account type if sub_id is being updated
        let is_supplier = currentAccount.is_supplier || 0;
        let is_customer = currentAccount.is_customer || 0;
        let is_employee = currentAccount.is_employee || 0;
        let is_driver = currentAccount.is_driver || 0;
        let is_delivery_man = currentAccount.is_delivery_man || 0;
        let is_salesman = currentAccount.is_salesman || 0;

        // If sub_id is being updated, recalculate account type flags
        if (req_object.sub_id && req_object.sub_id !== currentAccount.sub_id) {
          const subhead = await tx.account_sub_head.findUnique({
            where: { sub_id: req_object.sub_id },
          });

          if (subhead) {
            const subheadName = subhead.subhead_nam.toLowerCase();
            is_supplier =
              subheadName === "former" ||
                subheadName.includes("former") ||
                subheadName === "supplier" ||
                subheadName.includes("supplier")
                ? 1
                : 0;
            is_customer =
              subheadName === "purcher" ||
                subheadName.includes("purcher") ||
                subheadName === "customer" ||
                subheadName.includes("customer")
                ? 1
                : 0;
            is_employee = 0;
            is_driver = 0;
            is_delivery_man = 0;
            is_salesman = 0;
          }
        }

        // Update account with account type flags
        const updateData = {
          ...req_object,
          is_supplier,
          is_customer,
          is_employee,
          is_driver,
          is_delivery_man,
          is_salesman,
        };

        const updated = await AccountsRepository.update(acc_id, updateData, tx);

        // Handle opening balance transaction (double-entry)
        const openingBalance = req_object.opening_balance;
        // Determine balance type: if balance_type is provided, use it; otherwise infer from opening_balance sign
        // Negative opening_balance = credit scenario, Positive opening_balance = debit scenario
        let balanceType = req_object.balance_type;
        if (
          !balanceType &&
          openingBalance !== undefined &&
          openingBalance !== null
        ) {
          // Infer from sign: negative = credit, positive = debit
          balanceType = openingBalance < 0 ? "credit" : "debit";
        }
        balanceType = (balanceType || "credit").toLowerCase().trim(); // "debit" or "credit"

        console.log("Opening Balance Transaction - UPDATE:");
        console.log("  openingBalance:", openingBalance);
        console.log("  balanceType (raw):", req_object.balance_type);
        console.log("  balanceType (inferred/used):", balanceType);

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

          console.log("  isDebit:", isDebit);
          console.log("  absoluteBalance:", absoluteBalance);

          // Find or create "Opening Balance" account
          let openingBalanceSubhead =
            await AccountSubHeadRepository.findByName("Opening Balance");
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
                tx,
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
              // When debit: newAccount -> debit, openingBalance -> credit
              // When credit: newAccount -> credit, openingBalance -> debit
              console.log("  Updating existing transactions:");
              console.log(
                "    New Account:",
                acc_id,
                "- Debit:",
                isDebit ? absoluteBalance : 0,
                "- Credit:",
                isDebit ? 0 : absoluteBalance,
              );
              console.log(
                "    Opening Balance:",
                openingBalanceAccount.acc_id,
                "- Debit:",
                isDebit ? 0 : absoluteBalance,
                "- Credit:",
                isDebit ? absoluteBalance : 0,
              );

              await tx.transaction.update({
                where: { t_id: existingAccountTransaction.t_id },
                data: {
                  debit: isDebit ? absoluteBalance : 0,
                  credit: isDebit ? 0 : absoluteBalance,
                  remarks: `Opening balance for account: ${account_nam.trim()}`,
                  update_by: req_object.update_by || "user 1",
                },
              });

              await tx.transaction.update({
                where: { t_id: existingOpeningBalanceTransaction.t_id },
                data: {
                  debit: isDebit ? 0 : absoluteBalance,
                  credit: isDebit ? absoluteBalance : 0,
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
              // When debit: newAccount -> debit, openingBalance -> credit
              // When credit: newAccount -> credit, openingBalance -> debit
              if (isDebit) {
                console.log("  Creating new DEBIT transactions:");
                console.log(
                  "    New Account:",
                  acc_id,
                  "- Debit:",
                  absoluteBalance,
                );
                console.log(
                  "    Opening Balance:",
                  openingBalanceAccount.acc_id,
                  "- Credit:",
                  absoluteBalance,
                );
              } else {
                console.log("  Creating new CREDIT transactions:");
                console.log(
                  "    Opening Balance:",
                  openingBalanceAccount.acc_id,
                  "- Debit:",
                  absoluteBalance,
                );
                console.log(
                  "    New Account:",
                  acc_id,
                  "- Credit:",
                  absoluteBalance,
                );
              }

              // Transaction 1: Opening Balance account
              await TransactionRepository.create(
                {
                  acc_id: openingBalanceAccount.acc_id,
                  reference_id: Number(acc_id),
                  reference: "Opening Balance",
                  debit: isDebit ? 0 : absoluteBalance,
                  credit: isDebit ? absoluteBalance : 0,
                  remarks: `Opening balance for account: ${account_nam.trim()}`,
                  financial_year: new Date().getFullYear().toString(),
                  voucher_type: "OB",
                  insert_by: req_object.update_by || "user 1",
                  update_by: req_object.update_by || "user 1",
                },
                tx,
              );

              // Transaction 2: Account
              await TransactionRepository.create(
                {
                  acc_id: Number(acc_id),
                  reference_id: Number(acc_id),
                  reference: "Opening Balance",
                  debit: isDebit ? absoluteBalance : 0,
                  credit: isDebit ? 0 : absoluteBalance,
                  remarks: `Opening balance for account: ${account_nam.trim()}`,
                  financial_year: new Date().getFullYear().toString(),
                  voucher_type: "OB",
                  insert_by: req_object.update_by || "user 1",
                  update_by: req_object.update_by || "user 1",
                },
                tx,
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
                  voucher_type: "OB",
                  insert_by: req_object.update_by || "user 1",
                  update_by: req_object.update_by || "user 1",
                },
                tx,
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
                tx,
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

      // Fetch updated account to get account type flags
      const updatedAccount = await AccountsRepository.readById(acc_id);

      await RedisService.del("accounts:all");
      await RedisService.del("transactions:all");
      // Clear supplier and customer caches if account type is set
      if (updatedAccount?.is_supplier === 1) {
        await RedisService.del("suppliers:all");
      }
      if (updatedAccount?.is_customer === 1) {
        await RedisService.del("customers:all");
      }
      return successResponse(result, "Account updated successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to update account in Method: AccountsController.update",
          err,
        );
        return errorResponse(new Error("Account not found"), 404);
      }
      ErrorLogger.log(
        "Failed to update account in Method: AccountsController.update",
        err,
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
          new Error("acc_id is required"),
        );
        return errorResponse(new Error("acc_id is required"), 400);
      }

      await AccountsRepository.delete(acc_id);
      return successResponse({}, "Account deleted successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to delete account in Method: AccountsController.delete",
          err,
        );
        return errorResponse(new Error("Account not found"), 404);
      }
      ErrorLogger.log(
        "Failed to delete account in Method: AccountsController.delete",
        err,
      );
      return errorResponse(err, 500);
    }
  }

  async readExpenseAccounts() {
    try {
      const data = await AccountsRepository.readExpenseAccounts();
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get expense accounts in Method: AccountsController.readExpenseAccounts",
        err,
      );
      return errorResponse(err, 500);
    }
  }
}

export default new AccountsController();
