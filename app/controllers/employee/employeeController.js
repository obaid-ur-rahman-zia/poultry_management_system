import { successResponse, errorResponse } from "@/app/utils/response";
import ErrorLogger from "@/app/utils/errorLogger";
import EmployeeRepository from "@/app/repositories/employee/employeeRepository.js";
import { AccountConfigService } from "@/app/utils/accountConfigService";
import RedisService from "@/app/utils/redis";

class EmployeeController {
  async readAll() {
    const cacheKey = "employees:all";
    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        console.log("Employee Cache Hit");
        return successResponse(cachedData, "Success");
      }
      console.log("Employee Cache Miss");
      const employee_data = await EmployeeRepository.readAll();
      const nextId = await EmployeeRepository.readNextId();
      await RedisService.setex(
        cacheKey,
        300,
        JSON.stringify({ employee_data, nextId })
      );
      return successResponse({ employee_data, nextId }, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get employees in Method: EmployeeController.readAll",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async create(req) {
    try {
      const { req_object } = await req.json();

      const {
        employee_name,
        employee_cnic,
        employee_address,
        employee_alternate_name,
        employee_contact,
        employee_reference,
        designation_id,
      } = req_object;

      // Validate required fields
      if (
        !employee_name ||
        !employee_cnic ||
        !employee_address ||
        !employee_contact ||
        !designation_id
      ) {
        const error = new Error(
          "employee_name, employee_cnic, employee_address, employee_contact and designation_id are required"
        );
        ErrorLogger.log(
          "Failed to create employee in Method: EmployeeController.create",
          error
        );
        return errorResponse(error, 400);
      }

      //check if account_cnic is unique
      const duplicate = await EmployeeRepository.checkDuplicate(
        employee_cnic.trim()
      );
      if (duplicate) {
        const error = new Error("Account with this CNIC already exists");
        ErrorLogger.log(
          "Failed to create employee in Method: EmployeeController.create",
          error
        );
        return errorResponse(error, 400);
      }

      // Get account config
      const configService = new AccountConfigService();
      const config = await configService.getAccountConfig("Employee");

      // Prepare employee data
      const employeeData = {
        head_id: config.head_id,
        sub_id: config.sub_id,
        account_nam: employee_name.trim(),
        account_address: employee_address.trim(),
        account_alter_nam: employee_alternate_name.trim(),
        account_contact: employee_contact.trim(),
        account_reference: employee_reference.trim(),
        account_cnic: employee_cnic.trim(),
        designation_id: designation_id,
      };

      const employee = await EmployeeRepository.create(employeeData);
      await RedisService.del("employees:all");
      await RedisService.del("customers:all");
      await RedisService.del("suppliers:all");
      await RedisService.del("accounts:all");
      return successResponse(
        {
          acc_id: employee.acc_id,
          account_id: employee.account_id,
        },
        "Employee created successfully"
      );
    } catch (err) {
      if (err.code === "P2002") {
        return errorResponse(
          new Error("Employee with this combination already exists"),
          400
        );
      }
      if (err.code === "P2003") {
        return errorResponse(
          new Error("Invalid reference - referenced record does not exist"),
          400
        );
      }
      ErrorLogger.log(
        "Failed to create employee in Method: EmployeeController.create",
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
          "Failed to get employee by id in Method: EmployeeController.readById",
          error
        );
        return errorResponse(error, 400);
      }

      const result = await EmployeeRepository.readById(acc_id);

      if (!result) {
        ErrorLogger.log(
          "Failed to get employee by id in Method: EmployeeController.readById",
          new Error("Employee not found")
        );
        return errorResponse(new Error("Employee not found"), 404);
      }

      return successResponse(result, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get employee by id in Method: EmployeeController.readById",
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
          "Failed to update employee in Method: EmployeeController.update",
          error
        );
        return errorResponse(error, 400);
      }

      // Check if employee exists
      const existingEmployee = await EmployeeRepository.readById(acc_id);
      if (!existingEmployee) {
        const error = new Error("Employee not found");
        ErrorLogger.log(
          "Failed to update employee in Method: EmployeeController.update",
          error
        );
        return errorResponse(error, 404);
      }

      // Validate designation_id if provided
      if (!req_object.designation_id) {
        const error = new Error("designation_id is required");
        ErrorLogger.log(
          "Failed to update employee in Method: EmployeeController.update",
          error
        );
        return errorResponse(error, 400);
      }

      // Prepare update data
      const updateData = {
        acc_id: acc_id,
        account_nam: req_object.employee_name.trim(),
        account_cnic: req_object.employee_cnic.trim(),
        account_address: req_object.employee_address.trim(),
        account_alter_nam: req_object.employee_alternate_name.trim(),
        account_contact: req_object.employee_contact.trim(),
        account_reference: req_object.employee_reference.trim(),
        designation_id: req_object.designation_id,
      };

      const updatedEmployee = await EmployeeRepository.update(updateData);
      await RedisService.del("employees:all");
      return successResponse(updatedEmployee, "Employee updated successfully");
    } catch (err) {
      if (err.code === "P2025") {
        ErrorLogger.log(
          "Failed to update employee in Method: EmployeeController.update",
          err
        );
        return errorResponse(new Error("Employee not found"), 404);
      }
      if (err.code === "P2003") {
        return errorResponse(
          new Error("Invalid reference - referenced record does not exist"),
          400
        );
      }
      ErrorLogger.log(
        "Failed to update employee in Method: EmployeeController.update",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readAssignedArea(req) {
    try {
      const { searchParams } = new URL(req.url);
      const acc_id = searchParams.get("acc_id");

      if (!acc_id) {
        const error = new Error("acc_id is required");
        ErrorLogger.log(
          "Failed to get employee assigned area in Method: EmployeeController.readAssignedArea",
          error
        );
        return errorResponse(error, 400);
      }

      const data = await EmployeeRepository.readAssignedArea(acc_id);
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get employee assigned area in Method: EmployeeController.readAssignedArea",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async assignArea(req) {
    try {
      const { req_object } = await req.json();
      const { acc_id, area_assignments } = req_object;
      // area_assignments format: [{ area_id: 1, vehicle_id: 5 }, { area_id: 2, vehicle_id: 3 }]

      if (!acc_id || !area_assignments) {
        const error = new Error("acc_id and area_assignments are required");
        ErrorLogger.log(
          "Failed to assign areas in Method: EmployeeController.assignArea",
          error
        );
        return errorResponse(error, 400);
      }

      // Validate that all assignments have both area_id and vehicle_id
      const isValid = area_assignments.every(
        (assignment) => assignment.area_id && assignment.vehicle_id
      );

      if (!isValid) {
        const error = new Error(
          "Each assignment must have area_id and vehicle_id"
        );
        ErrorLogger.log(
          "Failed to assign areas in Method: EmployeeController.assignArea",
          error
        );
        return errorResponse(error, 400);
      }

      const result = await EmployeeRepository.assignAreas(
        acc_id,
        area_assignments
      );

      return successResponse(result, "Areas assigned successfully");
    } catch (err) {
      ErrorLogger.log(
        "Failed to assign areas in Method: EmployeeController.assignArea",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readByArea(req) {
    try {
      const { searchParams } = new URL(req.url);
      const area_id = searchParams.get("area_id");

      if (!area_id) {
        const error = new Error("area_id is required");
        ErrorLogger.log(
          "Failed to get employees by area in Method: EmployeeController.readByArea",
          error
        );
        return errorResponse(error, 400);
      }

      const data = await EmployeeRepository.readByArea(area_id);
      return successResponse(data, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to get employees by area in Method: EmployeeController.readByArea",
        err
      );
      return errorResponse(err, 500);
    }
  }

  async readRecovery(req) {
    try {
      const { searchParams } = new URL(req.url);
      const date = searchParams.get("date");
      const salesman_id = searchParams.get("salesman_id");
      const area_id = searchParams.get("area_id");
      const subarea_id = searchParams.get("subarea_id");
      // Convert date string to Date objects for start and end of day

      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      if (!startDate || !endDate || !salesman_id || !area_id || !subarea_id) {
        const error = new Error(
          "start_dat, end_dat, salesman_id, area_id, and subarea_id are required"
        );
        ErrorLogger.log(
          "Failed to read report detail in Method: SaleController.readReportDetail",
          error
        );
        return errorResponse(error, 400);
      }
      const recovery = await EmployeeRepository.readRecovery({
        salesman_id: salesman_id,
        area_id: area_id,
        subarea_id: subarea_id,
        startDate: startDate,
        endDate: endDate,
      });
      return successResponse(recovery, "Success");
    } catch (err) {
      ErrorLogger.log(
        "Failed to read report detail in Method: SaleController.readReportDetail",
        err
      );
      return errorResponse(err, 500);
    }
  }
}

export default new EmployeeController();
