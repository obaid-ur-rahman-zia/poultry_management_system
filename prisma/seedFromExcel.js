import prisma from "../lib/prisma.js";
import XLSX from "xlsx";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration: Map Excel sheet names to Prisma models and their field mappings
const SHEET_CONFIG = {
  // Account Heads
  "Account Heads": {
    model: "account_head",
    fields: {
      head_nam: "Name", // Excel column "Name" maps to head_nam
    },
  },

  // Account Sub Heads
  "Account Sub Heads": {
    model: "account_sub_head",
    fields: {
      head_id: "Head ID",
      subhead_id: "Subhead ID",
      subhead_nam: "Name",
      is_parent: "Is Parent",
      parent_sub_id: "Parent Sub ID",
    },
    transforms: {
      is_parent: (val) => val === 1 || val === "1" || val === true || val === "true" ? 1 : 0,
      parent_sub_id: (val) => val === "" || val === null || val === undefined ? null : parseInt(val),
      head_id: (val) => parseInt(val),
      subhead_id: (val) => parseInt(val),
    },
  },

  // Accounts
  Accounts: {
    model: "accounts",
    fields: {
      head_id: "Head ID",
      sub_id: "Sub ID",
      account_id: "Account ID",
      account_nam: "Account Name",
      account_cnic: "CNIC",
      account_address: "Address",
      account_alter_nam: "Alternate Name",
      account_contact: "Contact",
      account_reference: "Reference",
      account_no: "Account Number",
      is_employee: "Is Employee",
      is_driver: "Is Driver",
      is_delivery_man: "Is Delivery Man",
      is_customer: "Is Customer",
      is_supplier: "Is Supplier",
      is_salesman: "Is Salesman",
      credit_limit: "Credit Limit",
      cgroup_id: "Customer Group ID",
      subarea_id: "Subarea ID",
      company_id: "Company ID",
      designation_id: "Designation ID",
    },
    transforms: {
      head_id: (val) => parseInt(val),
      sub_id: (val) => parseInt(val),
      account_id: (val) => parseInt(val),
      is_employee: (val) => val === 1 || val === "1" || val === true || val === "true" ? 1 : 0,
      is_driver: (val) => val === 1 || val === "1" || val === true || val === "true" ? 1 : 0,
      is_delivery_man: (val) => val === 1 || val === "1" || val === true || val === "true" ? 1 : 0,
      is_customer: (val) => val === 1 || val === "1" || val === true || val === "true" ? 1 : 0,
      is_supplier: (val) => val === 1 || val === "1" || val === true || val === "true" ? 1 : 0,
      is_salesman: (val) => val === 1 || val === "1" || val === true || val === "true" ? 1 : 0,
      credit_limit: (val) => val === "" || val === null || val === undefined ? null : parseFloat(val),
      cgroup_id: (val) => val === "" || val === null || val === undefined ? null : parseInt(val),
      subarea_id: (val) => val === "" || val === null || val === undefined ? null : parseInt(val),
      company_id: (val) => val === "" || val === null || val === undefined ? null : parseInt(val),
      designation_id: (val) => val === "" || val === null || val === undefined ? null : parseInt(val),
    },
  },

  // Products
  Products: {
    model: "product",
    fields: {
      product_title: "Product Title",
      product_description: "Product Description",
      procategory_id: "Category ID",
      prounit_id: "Unit ID",
      company_id: "Company ID",
      pgroup_id: "Product Group ID",
      purchase_price: "Purchase Price",
      sale_price: "Sale Price",
      avg_price: "Average Price",
      barcode: "Barcode",
      packing: "Packing",
      reorder_level: "Reorder Level",
      current_stock: "Current Stock",
      sales_mc: "Sales MC",
      location: "Location",
      discount_amount: "Discount Amount",
      discount_percent: "Discount Percent",
      tax_amount: "Tax Amount",
      tax_percent: "Tax Percent",
      isTaxApplied: "Is Tax Applied",
      isDiscountApplied: "Is Discount Applied",
      isDiscountedPercentage: "Is Discounted Percentage",
      isTaxPercentage: "Is Tax Percentage",
      isTaxAppliedCondition: "Is Tax Applied Condition",
    },
    transforms: {
      procategory_id: (val) => parseInt(val),
      prounit_id: (val) => parseInt(val),
      company_id: (val) => parseInt(val),
      pgroup_id: (val) => parseInt(val),
      purchase_price: (val) => parseFloat(val) || 0,
      sale_price: (val) => parseFloat(val) || 0,
      avg_price: (val) => parseFloat(val) || 0,
      packing: (val) => val === "" || val === null || val === undefined ? null : parseFloat(val),
      reorder_level: (val) => val === "" || val === null || val === undefined ? null : parseFloat(val),
      current_stock: (val) => val === "" || val === null || val === undefined ? null : parseFloat(val),
      sales_mc: (val) => val === "" || val === null || val === undefined ? null : parseFloat(val),
      discount_amount: (val) => val === "" || val === null || val === undefined ? null : parseFloat(val),
      discount_percent: (val) => val === "" || val === null || val === undefined ? null : parseFloat(val),
      tax_amount: (val) => val === "" || val === null || val === undefined ? null : parseFloat(val),
      tax_percent: (val) => val === "" || val === null || val === undefined ? null : parseFloat(val),
      isTaxApplied: (val) => val === 1 || val === "1" || val === true || val === "true" ? 1 : 0,
      isDiscountApplied: (val) => val === 1 || val === "1" || val === true || val === "true" ? 1 : 0,
      isDiscountedPercentage: (val) => val === 1 || val === "1" || val === true || val === "true" ? 1 : 0,
      isTaxPercentage: (val) => val === 1 || val === "1" || val === true || val === "true" ? 1 : 0,
      isTaxAppliedCondition: (val) => val === 1 || val === "1" || val === true || val === "true" ? 1 : 0,
    },
  },

  // Companies
  Companies: {
    model: "pro_company",
    fields: {
      company_nam: "Company Name",
    },
  },

  // Categories
  Categories: {
    model: "pro_category",
    fields: {
      procategory_nam: "Category Name",
      parent_id: "Parent ID",
      is_parent: "Is Parent",
    },
    transforms: {
      parent_id: (val) => val === "" || val === null || val === undefined ? null : parseInt(val),
      is_parent: (val) => val === 1 || val === "1" || val === true || val === "true" ? 1 : 0,
    },
  },

  // Farms
  Farms: {
    model: "farm",
    fields: {
      farm_nam: "Farm Name",
      capacity: "Capacity",
      address: "Address",
    },
    transforms: {
      capacity: (val) => val === "" || val === null || val === undefined ? null : parseFloat(val),
    },
  },

  // Units (Product Units)
  Units: {
    model: "pro_unit",
    fields: {
      prounit_nam: "Unit Name",
      parent_id: "Parent ID",
      is_parent: "Is Parent",
    },
    transforms: {
      parent_id: (val) => val === "" || val === null || val === undefined ? null : parseInt(val),
      is_parent: (val) => val === 1 || val === "1" || val === true || val === "true" ? 1 : 0,
    },
  },

  // Product Groups
  "Product Groups": {
    model: "product_group",
    fields: {
      pgroup_nam: "Product Group Name",
    },
  },

  // Warehouses
  Warehouses: {
    model: "warehouse",
    fields: {
      warehouse_nam: "Warehouse Name",
    },
  },

  // Customer Groups
  "Customer Groups": {
    model: "customer_group",
    fields: {
      cgroup_nam: "Customer Group Name",
    },
  },

  // Employee Designations
  "Employee Designations": {
    model: "employee_designation",
    fields: {
      designation_nam: "Designation Name",
    },
  },

  // Vehicle Types
  "Vehicle Types": {
    model: "vehicle_type",
    fields: {
      vehicle_type_nam: "Vehicle Type Name",
    },
  },

  // Vehicles
  Vehicles: {
    model: "vehicle",
    fields: {
      vehicle_type_id: "Vehicle Type ID",
      vehicle_nam: "Vehicle Name",
      vehicle_plate: "Vehicle Plate",
      driver_id: "Driver ID",
      deliveryman_id: "Deliveryman ID",
      is_assigned: "Is Assigned",
    },
    transforms: {
      vehicle_type_id: (val) => parseInt(val),
      driver_id: (val) => val === "" || val === null || val === undefined ? null : parseInt(val),
      deliveryman_id: (val) => val === "" || val === null || val === undefined ? null : parseInt(val),
      is_assigned: (val) => val === 1 || val === "1" || val === true || val === "true" ? 1 : 0,
    },
  },

  // Return Types
  "Return Types": {
    model: "return_type",
    fields: {
      return_type_nam: "Return Type Name",
    },
  },

  // Account Manage
  "Account Manage": {
    model: "account_manage",
    fields: {
      head_id: "Head ID",
      sub_id: "Sub ID",
      acc_id: "Account ID",
      description: "Description",
      account_lvl: "Account Level",
      display_category: "Display Category",
      is_active: "Is Active",
    },
    transforms: {
      head_id: (val) => parseInt(val),
      sub_id: (val) => parseInt(val),
      acc_id: (val) => val === "" || val === null || val === undefined ? null : parseInt(val),
      account_lvl: (val) => parseInt(val),
      display_category: (val) => val === 1 || val === "1" || val === true || val === "true" ? 1 : 0,
      is_active: (val) => val === 1 || val === "1" || val === true || val === "true" ? 1 : 0,
    },
  },

  // Users
  Users: {
    model: "user",
    fields: {
      user_nam: "User Name",
      email: "Email",
      password: "Password",
      role: "Role",
      profile_picture: "Profile Picture",
      phone: "Phone",
      address: "Address",
      status: "Status",
    },
    transforms: {
      status: (val) => val === "" || val === null || val === undefined ? 1 : parseInt(val),
      role: (val) => val.toUpperCase().replace(/\s+/g, "_"), // Convert to enum format
    },
  },

  // Flocs (Note: stackholders is JSON, may need special handling)
  Flocs: {
    model: "floc",
    fields: {
      farm_id: "Farm ID",
      starting_date: "Starting Date",
      ending_date: "Ending Date",
      stackholders: "Stackholders", // JSON string: [{"acc_id":1,"percentage":50},{"acc_id":2,"percentage":50}]
      clear_description: "Clear Description",
    },
    transforms: {
      farm_id: (val) => parseInt(val),
      starting_date: (val) => new Date(val),
      ending_date: (val) => val === "" || val === null || val === undefined ? null : new Date(val),
      stackholders: (val) => {
        if (!val || val === "") return JSON.stringify([]);
        try {
          // If it's already a JSON string, parse and stringify to validate
          if (typeof val === "string") {
            const parsed = JSON.parse(val);
            return JSON.stringify(parsed);
          }
          return JSON.stringify(val);
        } catch {
          return JSON.stringify([]);
        }
      },
    },
  },

  // Area Assignments
  "Area Assignments": {
    model: "area_assignment",
    fields: {
      area_id: "Area ID",
      acc_id: "Account ID",
      vehicle_id: "Vehicle ID",
      is_active: "Is Active",
      status: "Status",
    },
    transforms: {
      area_id: (val) => parseInt(val),
      acc_id: (val) => parseInt(val),
      vehicle_id: (val) => parseInt(val),
      is_active: (val) => val === "" || val === null || val === undefined ? 1 : (val === 1 || val === "1" || val === true || val === "true" ? 1 : 0),
      status: (val) => val === "" || val === null || val === undefined ? 1 : parseInt(val),
    },
  },

  // Screen Groups
  "Screen Groups": {
    model: "screen_group",
    fields: {
      group_nam: "Group Name",
      description: "Description",
      display_order: "Display Order",
      is_parent: "Is Parent",
      parent_id: "Parent ID",
    },
    transforms: {
      display_order: (val) => parseInt(val),
      is_parent: (val) => val === 1 || val === "1" || val === true || val === "true" ? 1 : 0,
      parent_id: (val) => val === "" || val === null || val === undefined ? null : parseInt(val),
    },
  },

  // Screen Codes
  "Screen Codes": {
    model: "screen_code",
    fields: {
      screen_nam: "Screen Name",
      description: "Description",
      screen_type: "Screen Type",
      is_save: "Is Save",
      is_modify: "Is Modify",
      is_read: "Is Read",
      group_id: "Group ID",
      display_order: "Display Order",
    },
    transforms: {
      is_save: (val) => val === 1 || val === "1" || val === true || val === "true" ? 1 : 0,
      is_modify: (val) => val === 1 || val === "1" || val === true || val === "true" ? 1 : 0,
      is_read: (val) => val === 1 || val === "1" || val === true || val === "true" ? 1 : 0,
      group_id: (val) => parseInt(val),
      display_order: (val) => parseInt(val),
    },
  },
};

/**
 * Convert Excel row to database record
 */
function mapRowToRecord(row, config) {
  const record = {};
  const { fields, transforms = {} } = config;

  for (const [dbField, excelColumn] of Object.entries(fields)) {
    const value = row[excelColumn];
    
    if (value === undefined || value === null || value === "") {
      // Skip empty values unless it's a required field
      continue;
    }

    // Apply transform if exists
    if (transforms[dbField]) {
      record[dbField] = transforms[dbField](value);
    } else {
      record[dbField] = value;
    }
  }

  return record;
}

/**
 * Read Excel file and return sheets data
 */
function readExcelFile(filePath) {
  try {
    const fileBuffer = readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheets = {};

    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      sheets[sheetName] = data;
    });

    return sheets;
  } catch (error) {
    throw new Error(`Error reading Excel file: ${error.message}`);
  }
}

/**
 * Seed data from Excel file
 */
async function seedFromExcel(filePath) {
  console.log(`📖 Reading Excel file: ${filePath}`);
  const sheets = readExcelFile(filePath);

  console.log(`📊 Found ${Object.keys(sheets).length} sheet(s): ${Object.keys(sheets).join(", ")}`);

  for (const [sheetName, rows] of Object.entries(sheets)) {
    const config = SHEET_CONFIG[sheetName];

    if (!config) {
      console.log(`⚠️  Skipping sheet "${sheetName}" - no configuration found`);
      console.log(`   Available configurations: ${Object.keys(SHEET_CONFIG).join(", ")}`);
      continue;
    }

    console.log(`\n📝 Processing sheet: "${sheetName}" (${rows.length} rows)`);
    console.log(`   Model: ${config.model}`);

    if (rows.length === 0) {
      console.log(`   ⚠️  No data in sheet "${sheetName}"`);
      continue;
    }

    const records = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const record = mapRowToRecord(row, config);
        
        // Skip if record is empty
        if (Object.keys(record).length === 0) {
          console.log(`   ⚠️  Row ${i + 2} is empty, skipping`);
          continue;
        }

        records.push(record);
      } catch (error) {
        console.error(`   ❌ Error processing row ${i + 2}:`, error.message);
        errorCount++;
      }
    }

    if (records.length === 0) {
      console.log(`   ⚠️  No valid records to insert for sheet "${sheetName}"`);
      continue;
    }

    try {
      // Use createMany with skipDuplicates
      const result = await prisma[config.model].createMany({
        data: records,
        skipDuplicates: true,
      });

      successCount = result.count;
      console.log(`   ✅ Successfully inserted ${successCount} record(s)`);
      
      if (errorCount > 0) {
        console.log(`   ⚠️  ${errorCount} row(s) had errors`);
      }
    } catch (error) {
      console.error(`   ❌ Error inserting records for "${sheetName}":`, error.message);
      
      // Try inserting one by one to see which record fails
      console.log(`   🔄 Attempting individual inserts...`);
      for (const record of records) {
        try {
          await prisma[config.model].create({
            data: record,
          });
          successCount++;
        } catch (err) {
          console.error(`   ❌ Failed to insert record:`, record);
          console.error(`      Error:`, err.message);
          errorCount++;
        }
      }
      console.log(`   ✅ Successfully inserted ${successCount} record(s) individually`);
    }
  }
}

/**
 * Main function
 */
async function main() {
  console.log("🌱 Starting Excel seeding...\n");

  // Default Excel file path (you can change this or pass as argument)
  const excelFilePath = process.argv[2] || join(__dirname, "excel_sheets/seed_data.xlsx");

  try {
    await seedFromExcel(excelFilePath);
    console.log("\n✅ Excel seeding completed!");
  } catch (error) {
    console.error("\n❌ Excel seeding error:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

