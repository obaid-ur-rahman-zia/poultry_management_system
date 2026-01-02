import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import SupplierRepository from "@/app/repositories/supplier/supplierRepository";
import { AccountConfigService } from "@/app/utils/accountConfigService";
import AccountSubHeadRepository from "@/app/repositories/account/accountSubHead/accountSubHeadRepository";
import RedisService from "@/app/utils/redis";
import prisma from "@/lib/prisma";

class SupplierController {
  async readAll() {
    const cacheKey = "suppliers:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Supplier Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Supplier Cache Miss");
      const supplier_data = await SupplierRepository.readAll();
      const nextId = await SupplierRepository.readNextId();
      await RedisService.setex(
        cacheKey,
        300,
        JSON.stringify({ supplier_data, nextId })
      );
      return successResponse({ supplier_data, nextId }, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get suppliers in Method: SupplierController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async create(req) {
    try {
      const { req_object } = await req.json();

      const {
        supplier_name,
        supplier_cnic,
        supplier_address,
        supplier_contact,
        supplier_company_id,
      } = req_object;

      if (
        !supplier_name ||
        !supplier_cnic ||
        !supplier_address ||
        !supplier_contact ||
        !supplier_company_id
      ) {
        const error = new Error(
          "supplier Name, Supplier Cnic, Supplier Address, Supplier Contact, Company_id are required"
        );
        ErrorLogger.log(
          "Failed to create supplier in Method: SupplierController.create",
          error
        );
        return errorResponse(error, 400);
      }

      //check if account_cnic is unique
      const duplicate = await SupplierRepository.checkDuplicate(
        req_object.supplier_cnic.trim()
      );
      if (duplicate) {
        const error = new Error("Account with this CNIC already exists");
        ErrorLogger.log(
          "Failed to create supplier in Method: SupplierController.create",
          error
        );
        return errorResponse(error, 400);
      }

      // Try to get config, if not found, find or create Supplier subhead
      let config;
      try {
        const configService = new AccountConfigService();
        config = await configService.getAccountConfig("Supplier");
      } catch (error) {
        // Config not found, find or create Supplier subhead
        let supplierSubhead = await AccountSubHeadRepository.findByName(
          "Supplier"
        );

        if (!supplierSubhead) {
          // Get first account head to use for the subhead
          const firstHead = await prisma.account_head.findFirst({
            orderBy: { head_id: "asc" },
          });

          if (!firstHead) {
            throw new Error(
              "No account head found. Please create an account head first."
            );
          }

          // Create Supplier subhead
          supplierSubhead = await AccountSubHeadRepository.create({
            head_id: firstHead.head_id,
            subhead_nam: "Supplier",
            insert_by: "system",
            update_by: "system",
            status: 1,
          });
        }

        // Use the subhead for config
        config = {
          head_id: supplierSubhead.head_id,
          sub_id: supplierSubhead.sub_id,
        };
      }

      const supplier = await SupplierRepository.create({
        head_id: config.head_id,
        sub_id: config.sub_id,
        account_nam: req_object.supplier_name.trim(),
        account_address: req_object.supplier_address.trim(),
        account_alter_nam: req_object.supplier_alternate_name?.trim() || "",
        account_contact: req_object.supplier_contact.trim(),
        account_reference: req_object.supplier_reference?.trim() || "",
        account_cnic: req_object.supplier_cnic.trim(),
        company_id: req_object.supplier_company_id,
      });
      await RedisService.del("suppliers:all");
      await RedisService.del("customers:all");
      await RedisService.del("employees:all");
      await RedisService.del("accounts:all");
      return successResponse(
        {
          acc_id: supplier.acc_id,
          account_id: supplier.account_id,
        },
        "Supplier created successfully"
      );
    } catch (err) {
      if (err.code === "P2002") {
        return errorResponse(
          new Error("Supplier with this combination already exists"),
          400
        );
      }
      if (err.code === "P2003") {
        return errorResponse(
          new Error("Invalid company_id - referenced record does not exist"),
          400
        );
      }
      ErrorLogger.log(
        "Failed to create supplier in Method: SupplierController.create",
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
          "Failed to get supplier by id in Method: SupplierController.readById",
          error
        );
        return errorResponse(error, 400);
      }

      const result = await SupplierRepository.readById(acc_id);
      if (!result) {
        ErrorLogger.log(
          "Failed to get supplier by id in Method: SupplierController.readById",
          new Error("Supplier not found")
        );
        return errorResponse(new Error("Supplier not found"), 404);
      }

      return successResponse(result, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get supplier by id in Method: SupplierController.readById",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async update(req) {
    try {
      const { req_object } = await req.json();
      const { acc_id } = req_object;

      if (!acc_id) {
        const error = new Error("acc_id is required");
        ErrorLogger.log(
          "Failed to update supplier in Method: SupplierController.update",
          error
        );
        return errorResponse(error, 400);
      }

      const updatedSupplier = await SupplierRepository.update({
        acc_id: req_object.acc_id,
        account_nam: req_object.supplier_name.trim(),
        account_cnic: req_object.supplier_cnic.trim(),
        account_address: req_object.supplier_address.trim(),
        account_alter_nam: req_object.supplier_alternate_name.trim(),
        account_contact: req_object.supplier_contact.trim(),
        account_reference: req_object.supplier_reference.trim(),
        company_id: req_object.supplier_company_id,
      });
      await RedisService.del("suppliers:all");
      return successResponse(updatedSupplier, "Supplier updated successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to update supplier in Method: SupplierController.update",
          err
        );
        return errorResponse(new Error("Supplier not found"), 404);
      }
      if (err.code === "P2003") {
        return errorResponse(
          new Error("Invalid company_id - referenced record does not exist"),
          400
        );
      }
      ErrorLogger.log(
        "Failed to update supplier in Method: SupplierController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readByCompany(req) {
    try {
      const { searchParams } = new URL(req.url);
      const company_id = searchParams.get("company_id");

      if (!company_id) {
        const error = new Error("company_id is required");
        ErrorLogger.log(
          "Failed to get suppliers by group in Method: SupplierController.readByCompany",
          error
        );
        return errorResponse(error, 400);
      }

      const data = await SupplierRepository.readByCompany(company_id);
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get suppliers by group in Method: SupplierController.readBySupplierGroup",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new SupplierController();
