import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import CustomerRepository from "@/app/repositories/customer/customerRepository";
import { AccountConfigService } from "@/app/utils/accountConfigService";
import AccountSubHeadRepository from "@/app/repositories/account/accountSubHead/accountSubHeadRepository";
import RedisService from "@/app/utils/redis";
import prisma from "@/lib/prisma";

class CustomerController {
  async readAll() {
    const cacheKey = "customers:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Customer Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Customer Cache Miss");
      const customer_data = await CustomerRepository.readAll();
      const nextId = await CustomerRepository.readNextId();
      await RedisService.setex(
        cacheKey,
        300,
        JSON.stringify({ customer_data, nextId })
      );
      return successResponse({ customer_data, nextId }, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get customers in Method: CustomerController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async create(req) {
    try {
      const { req_object } = await req.json();

      const {
        customer_name,
        customer_cnic,
        customer_address,
        customer_contact,
        customer_credit_limit,
        cgroup_id,
        subarea_id,
      } = req_object;

      if (
        !customer_name ||
        !customer_cnic ||
        !customer_address ||
        !customer_contact ||
        customer_credit_limit === 0 ||
        !cgroup_id ||
        !subarea_id
      ) {
        const error = new Error(
          "customer_name, customer_cnic, customer_address, customer_contact,  customer_credit_limit, cgroup_id and subarea_id are required"
        );
        ErrorLogger.log(
          "Failed to create customer in Method: CustomerController.create",
          error
        );
        return errorResponse(error, 400);
      }

      //check if account_cnic is unique
      const duplicate = await CustomerRepository.checkDuplicate(
        req_object.customer_cnic.trim()
      );
      if (duplicate) {
        const error = new Error("Account with this CNIC already exists");
        ErrorLogger.log(
          "Failed to update customer in Method: CustomerController.update",
          error
        );
        return errorResponse(error, 400);
      }

      // Try to get config, if not found, find or create Customer subhead
      let config;
      try {
        const configService = new AccountConfigService();
        config = await configService.getAccountConfig("Customer");
      } catch (error) {
        // Config not found, find or create Customer subhead
        let customerSubhead = await AccountSubHeadRepository.findByName("Customer");
        
        if (!customerSubhead) {
          // Get first account head to use for the subhead
          const firstHead = await prisma.account_head.findFirst({
            orderBy: { head_id: "asc" },
          });

          if (!firstHead) {
            throw new Error("No account head found. Please create an account head first.");
          }

          // Create Customer subhead
          customerSubhead = await AccountSubHeadRepository.create({
            head_id: firstHead.head_id,
            subhead_nam: "Customer",
            insert_by: "system",
            update_by: "system",
            status: 1,
          });
        }

        // Use the subhead for config
        config = {
          head_id: customerSubhead.head_id,
          sub_id: customerSubhead.sub_id,
        };
      }

      const customer = await CustomerRepository.create({
        head_id: config.head_id,
        sub_id: config.sub_id,
        account_nam: req_object.customer_name.trim(),
        account_address: req_object.customer_address.trim(),
        account_alter_nam: req_object.customer_alternate_name?.trim() || "",
        account_contact: req_object.customer_contact.trim(),
        account_reference: req_object.customer_reference?.trim() || "",
        account_cnic: req_object.customer_cnic.trim(),
        credit_limit: req_object.customer_credit_limit,
        cgroup_id: req_object.cgroup_id,
        subarea_id: req_object.subarea_id,
      });
      await RedisService.del("customers:all");
      await RedisService.del("suppliers:all");
      await RedisService.del("employees:all");
      return successResponse(
        {
          acc_id: customer.acc_id,
          account_id: customer.account_id,
        },
        "Customer created successfully"
      );
    } catch (err) {
      if (err.code === "P2002") {
        return errorResponse(
          new Error("Customer with this combination already exists"),
          400
        );
      }
      if (err.code === "P2003") {
        return errorResponse(
          new Error("Invalid cgroup_id - referenced record does not exist"),
          400
        );
      }
      ErrorLogger.log(
        "Failed to create customer in Method: CustomerController.create",
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
          "Failed to get customer by id in Method: CustomerController.readById",
          error
        );
        return errorResponse(error, 400);
      }

      const result = await CustomerRepository.readById(acc_id);
      if (!result) {
        ErrorLogger.log(
          "Failed to get customer by id in Method: CustomerController.readById",
          new Error("Customer not found")
        );
        return errorResponse(new Error("Customer not found"), 404);
      }

      return successResponse(result, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get customer by id in Method: CustomerController.readById",
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
          "Failed to update customer in Method: CustomerController.update",
          error
        );
        return errorResponse(error, 400);
      }

      const updatedCustomer = await CustomerRepository.update({
        acc_id: req_object.acc_id,
        account_nam: req_object.customer_name.trim(),
        account_cnic: req_object.customer_cnic.trim(),
        account_address: req_object.customer_address.trim(),
        account_alter_nam: req_object.customer_alternate_name.trim(),
        account_contact: req_object.customer_contact.trim(),
        account_reference: req_object.customer_reference.trim(),
        credit_limit: req_object.customer_credit_limit,
        cgroup_id: req_object.cgroup_id,
        subarea_id: req_object.subarea_id,
      });
      await RedisService.del("customers:all");
      return successResponse(updatedCustomer, "Customer updated successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to update customer in Method: CustomerController.update",
          err
        );
        return errorResponse(new Error("Customer not found"), 404);
      }
      if (err.code === "P2003") {
        return errorResponse(
          new Error("Invalid cgroup_id - referenced record does not exist"),
          400
        );
      }
      ErrorLogger.log(
        "Failed to update customer in Method: CustomerController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readByCustomerGroup(req) {
    try {
      const { searchParams } = new URL(req.url);
      const cgroup_id = searchParams.get("cgroup_id");

      if (!cgroup_id) {
        const error = new Error("cgroup_id is required");
        ErrorLogger.log(
          "Failed to get customers by group in Method: CustomerController.readByCustomerGroup",
          error
        );
        return errorResponse(error, 400);
      }

      const data = await CustomerRepository.readByCustomerGroup(cgroup_id);
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get customers by group in Method: CustomerController.readByCustomerGroup",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new CustomerController();
