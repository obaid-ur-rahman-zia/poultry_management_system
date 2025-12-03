import prisma from "@/lib/prisma";

class EmployeeRepository {
  // Helper method to determine employee type flags based on designation
  async getEmployeeFlags(designation_id) {
    const designation = await prisma.employee_designation.findUnique({
      where: { designation_id },
      select: { designation_nam: true },
    });

    if (!designation) {
      throw new Error("Invalid designation_id");
    }

    const designationName = designation.designation_nam.toLowerCase();

    return {
      is_employee: 1, // All are employees
      is_salesman:
        designationName.includes("salesman") ||
        designationName.includes("sales")
          ? 1
          : 0,
      is_driver: designationName.includes("driver") ? 1 : 0,
      is_delivery_man: designationName.includes("delivery") ? 1 : 0,
    };
  }

  // Helper to get employee type string for display
  getEmployeeType(is_salesman, is_driver, is_delivery_man) {
    if (is_salesman) return "salesman";
    if (is_driver) return "driver";
    if (is_delivery_man) return "deliveryman";
    return "employee";
  }

  async readAll() {
    const employees = await prisma.accounts.findMany({
      where: {
        is_employee: 1,
      },
      orderBy: { acc_id: "asc" },
      select: {
        acc_id: true,
        account_nam: true,
        is_salesman: true,
        is_driver: true,
        is_delivery_man: true,
        employee_designation: {
          select: {
            designation_id: true,
            designation_nam: true,
          },
        },
      },
    });

    return employees.map((emp) => ({
      ...emp,
      employee_type: this.getEmployeeType(
        emp.is_salesman,
        emp.is_driver,
        emp.is_delivery_man
      ),
    }));
  }

  async readNextId() {
    const maxId = await prisma.accounts.aggregate({
      _max: { acc_id: true },
    });
    return (maxId._max.acc_id || 0) + 1;
  }

  async readRecovery(req_object) {
    const { salesman_id, area_id, subarea_id, startDate, endDate } = req_object;

    return prisma.sale.findMany({
      where: {
        salesman_id: parseInt(salesman_id),
        sale_dat: {
          gte: startDate,
          lte: endDate,
        },
        customer: {
          subarea_id: parseInt(subarea_id),
          subarea: {
            area_id: parseInt(area_id),
          },
        },
        is_deleted: false,
      },
      include: {
        customer: {
          include: {
            subarea: {
              include: {
                areas: true,
              },
            },
          },
        },
        salesman: {
          select: {
            acc_id: true,
            account_nam: true,
          },
        },
      },
      orderBy: {
        sale_id: "asc",
      },
    });
  }

  async create(data) {
    return await prisma.$transaction(
      async (tx) => {
        // Get employee type flags based on designation
        const flags = await this.getEmployeeFlags(data.designation_id);

        // Get the max account_id for this sub_id
        const maxAccount = await tx.accounts.findFirst({
          where: { sub_id: data.sub_id },
          orderBy: { account_id: "desc" },
          select: { account_id: true },
        });

        const nextAccountId = maxAccount ? maxAccount.account_id + 1 : 1;

        // Create the account with calculated account_id and flags
        return await tx.accounts.create({
          data: {
            head_id: data.head_id,
            sub_id: data.sub_id,
            account_id: nextAccountId,
            account_nam: data.account_nam,
            account_cnic: data.account_cnic,
            account_address: data.account_address,
            account_alter_nam: data.account_alter_nam,
            account_contact: data.account_contact,
            account_reference: data.account_reference,
            designation_id: data.designation_id,
            // Set flags based on designation
            is_employee: flags.is_employee,
            is_salesman: flags.is_salesman,
            is_driver: flags.is_driver,
            is_delivery_man: flags.is_delivery_man,
            insert_by: data.insert_by || "user 1",
            update_by: data.update_by || "user 1",
            status: 1,
          },
        });
      },
      {
        timeout: 10000,
        maxWait: 5000,
      }
    );
  }

  async checkDuplicate(account_cnic) {
    return prisma.accounts.findFirst({
      where: { account_cnic: account_cnic },
    });
  }

  async readByArea(area_id) {
    const assignment = await prisma.area_assignment.findFirst({
      where: {
        area_id: Number(area_id),
        is_active: 1,
        status: 1,
      },
      select: {
        acc_id: true,
      },
    });

    return assignment ? assignment.acc_id : null;
  }
  async readById(acc_id) {
    const employee = await prisma.accounts.findFirst({
      where: {
        acc_id: parseInt(acc_id),
        is_employee: 1,
      },
      select: {
        acc_id: true,
        head_id: true,
        sub_id: true,
        account_id: true,
        account_nam: true,
        account_cnic: true,
        account_address: true,
        account_alter_nam: true,
        account_contact: true,
        account_reference: true,
        designation_id: true,
        is_salesman: true,
        is_driver: true,
        is_delivery_man: true,
        insert_dat: true,
        update_dat: true,
        insert_by: true,
        update_by: true,
        status: true,
        employee_designation: {
          select: {
            designation_id: true,
            designation_nam: true,
          },
        },
      },
    });

    // // Add employee_type for backwards compatibility
    return {
      ...employee,
      employee_type: this.getEmployeeType(
        employee.is_salesman,
        employee.is_driver,
        employee.is_delivery_man
      ),
    };
  }

  async update(data) {
    return await prisma.$transaction(async (tx) => {
      // Get employee type flags based on new designation
      const flags = await this.getEmployeeFlags(data.designation_id);

      // Update the account with new flags
      return await tx.accounts.update({
        where: {
          acc_id: data.acc_id,
        },
        data: {
          account_nam: data.account_nam,
          account_cnic: data.account_cnic,
          account_address: data.account_address,
          account_alter_nam: data.account_alter_nam,
          account_contact: data.account_contact,
          account_reference: data.account_reference,
          designation_id: data.designation_id,
          // Update flags based on new designation
          is_salesman: flags.is_salesman,
          is_driver: flags.is_driver,
          is_delivery_man: flags.is_delivery_man,
        },
      });
    });
  }

  async delete(acc_id) {
    return prisma.accounts.delete({
      where: {
        acc_id: parseInt(acc_id),
      },
    });
  }

  async readAssignedArea(acc_id) {
    // Get active area assignments with vehicle details
    const assignments = await prisma.area_assignment.findMany({
      where: {
        acc_id: parseInt(acc_id),
        is_active: 1,
        status: 1,
      },
      include: {
        area: {
          select: {
            area_id: true,
            area_nam: true,
          },
        },
        vehicle: {
          select: {
            vehicle_id: true,
            vehicle_nam: true,
            vehicle_type: true,
            vehicle_plate: true,
            driver: {
              select: {
                acc_id: true,
                account_nam: true,
              },
            },
            deliveryman: {
              select: {
                acc_id: true,
                account_nam: true,
              },
            },
          },
        },
      },
      orderBy: {
        area: {
          area_nam: "asc",
        },
      },
    });

    // Transform to a cleaner format
    return assignments.map((assignment) => ({
      assignment_id: assignment.assignment_id,
      area: assignment.area,
      vehicle: assignment.vehicle,
    }));
  }

  async assignAreas(acc_id, area_assignments) {
    return await prisma.$transaction(async (tx) => {
      // 1️⃣ Get current active assignments
      const currentAssignments = await tx.area_assignment.findMany({
        where: {
          acc_id: acc_id,
          is_active: 1,
        },
        select: {
          assignment_id: true,
          area_id: true,
          vehicle_id: true,
        },
      });

      const currentAreaIds = currentAssignments.map((a) => a.area_id);
      const newAreaIds = area_assignments.map((a) => a.area_id);
      const currentVehicleIds = currentAssignments.map((a) => a.vehicle_id);
      const newVehicleIds = area_assignments.map((a) => a.vehicle_id);

      // 2️⃣ Compute differences
      const addedAreaIds = newAreaIds.filter(
        (id) => !currentAreaIds.includes(id)
      );
      const removedAreaIds = currentAreaIds.filter(
        (id) => !newAreaIds.includes(id)
      );
      const commonAreaIds = newAreaIds.filter((id) =>
        currentAreaIds.includes(id)
      );

      // 3️⃣ Delete removed assignments
      if (removedAreaIds.length > 0) {
        await tx.area_assignment.deleteMany({
          where: {
            acc_id: acc_id,
            area_id: { in: removedAreaIds },
            is_active: 1,
          },
        });

        // Update area is_assigned flag
        await tx.areas.updateMany({
          where: { area_id: { in: removedAreaIds } },
          data: { is_assigned: 0 },
        });
      }

      // 4️⃣ Check for vehicle changes in existing assignments
      const updatedAreaIds = [];
      for (const commonAreaId of commonAreaIds) {
        const currentAssignment = currentAssignments.find(
          (a) => a.area_id === commonAreaId
        );
        const newAssignment = area_assignments.find(
          (a) => a.area_id === commonAreaId
        );

        // If vehicle changed, deactivate old and create new
        if (currentAssignment.vehicle_id !== newAssignment.vehicle_id) {
          await tx.area_assignment.delete({
            where: { assignment_id: currentAssignment.assignment_id },
          });

          // Create new assignment with new vehicle
          await tx.area_assignment.create({
            data: {
              area_id: commonAreaId,
              acc_id: acc_id,
              vehicle_id: newAssignment.vehicle_id,
              is_active: 1,
            },
          });

          updatedAreaIds.push(commonAreaId);
        }
      }

      // 5️⃣ Create new assignments for added areas
      if (addedAreaIds.length > 0) {
        const newAssignments = area_assignments
          .filter((a) => addedAreaIds.includes(a.area_id))
          .map((a) => ({
            area_id: a.area_id,
            acc_id: acc_id,
            vehicle_id: a.vehicle_id,
            is_active: 1,
          }));

        await tx.area_assignment.createMany({
          data: newAssignments,
        });

        // Update area is_assigned flag
        await tx.areas.updateMany({
          where: { area_id: { in: addedAreaIds } },
          data: { is_assigned: 1 },
        });
      }

      // 6️⃣ Return summary
      return {
        updatedEmployee: acc_id,
        totalAssignments: newAreaIds.length,
        addedAreaIds,
        removedAreaIds,
        updatedAreaIds,
        summary: {
          added: addedAreaIds.length,
          removed: removedAreaIds.length,
          updated: updatedAreaIds.length,
        },
      };
    });
  }
}

export default new EmployeeRepository();
