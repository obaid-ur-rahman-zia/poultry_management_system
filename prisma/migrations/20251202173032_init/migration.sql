-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'USER');

-- CreateTable
CREATE TABLE "user" (
    "user_id" SERIAL NOT NULL,
    "user_nam" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "profile_picture" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "insert_dat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(3) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "pro_company" (
    "company_id" SERIAL NOT NULL,
    "company_nam" VARCHAR(155) NOT NULL,
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "pro_company_pkey" PRIMARY KEY ("company_id")
);

-- CreateTable
CREATE TABLE "pro_category" (
    "procategory_id" SERIAL NOT NULL,
    "procategory_nam" VARCHAR(100) NOT NULL,
    "parent_id" INTEGER,
    "is_parent" INTEGER NOT NULL DEFAULT 0,
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "pro_category_pkey" PRIMARY KEY ("procategory_id")
);

-- CreateTable
CREATE TABLE "pro_unit" (
    "prounit_id" SERIAL NOT NULL,
    "prounit_nam" VARCHAR(100) NOT NULL,
    "parent_id" INTEGER,
    "is_parent" INTEGER NOT NULL DEFAULT 0,
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "pro_unit_pkey" PRIMARY KEY ("prounit_id")
);

-- CreateTable
CREATE TABLE "customer_group" (
    "cgroup_id" SERIAL NOT NULL,
    "cgroup_nam" VARCHAR(155) NOT NULL,
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "customer_group_pkey" PRIMARY KEY ("cgroup_id")
);

-- CreateTable
CREATE TABLE "employee_designation" (
    "designation_id" SERIAL NOT NULL,
    "designation_nam" VARCHAR(155) NOT NULL,
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "employee_designation_pkey" PRIMARY KEY ("designation_id")
);

-- CreateTable
CREATE TABLE "warehouse" (
    "warehouse_id" SERIAL NOT NULL,
    "warehouse_nam" VARCHAR(155) NOT NULL,
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "warehouse_pkey" PRIMARY KEY ("warehouse_id")
);

-- CreateTable
CREATE TABLE "product_group" (
    "pgroup_id" SERIAL NOT NULL,
    "pgroup_nam" VARCHAR(155) NOT NULL,
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "product_group_pkey" PRIMARY KEY ("pgroup_id")
);

-- CreateTable
CREATE TABLE "product" (
    "product_id" SERIAL NOT NULL,
    "product_title" VARCHAR(255) NOT NULL,
    "product_description" VARCHAR(255),
    "procategory_id" INTEGER NOT NULL,
    "prounit_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,
    "pgroup_id" INTEGER NOT NULL,
    "purchase_price" DOUBLE PRECISION NOT NULL,
    "sale_price" DOUBLE PRECISION NOT NULL,
    "avg_price" DOUBLE PRECISION NOT NULL,
    "barcode" VARCHAR(255),
    "packing" DOUBLE PRECISION,
    "reorder_level" DOUBLE PRECISION,
    "current_stock" DOUBLE PRECISION,
    "sales_mc" DOUBLE PRECISION,
    "location" VARCHAR(255),
    "discount_amount" DOUBLE PRECISION,
    "discount_percent" DOUBLE PRECISION,
    "tax_amount" DOUBLE PRECISION,
    "tax_percent" DOUBLE PRECISION,
    "isTaxApplied" INTEGER NOT NULL DEFAULT 0,
    "isDiscountApplied" INTEGER NOT NULL DEFAULT 0,
    "isDiscountedPercentage" INTEGER NOT NULL DEFAULT 0,
    "isTaxPercentage" INTEGER NOT NULL DEFAULT 0,
    "isTaxAppliedCondition" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "purchase" (
    "purchase_id" SERIAL NOT NULL,
    "invoice_id" VARCHAR(255) NOT NULL,
    "purchase_dat" TIMESTAMP(3) NOT NULL,
    "invoice_dat" TIMESTAMP(3) NOT NULL,
    "acc_id" INTEGER NOT NULL,
    "subtotal_amount" DOUBLE PRECISION NOT NULL,
    "total_discount" DOUBLE PRECISION NOT NULL,
    "bill_tax" DOUBLE PRECISION NOT NULL,
    "packing_fare" DOUBLE PRECISION NOT NULL,
    "loading_fare" DOUBLE PRECISION NOT NULL,
    "adjust_up" DOUBLE PRECISION,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "paid_amount" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "insert_dat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(3) NOT NULL,
    "insert_by" TEXT NOT NULL DEFAULT 'user 1',
    "update_by" TEXT NOT NULL DEFAULT 'user 1',

    CONSTRAINT "purchase_pkey" PRIMARY KEY ("purchase_id")
);

-- CreateTable
CREATE TABLE "purchase_detail" (
    "id" SERIAL NOT NULL,
    "purchase_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "packing" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "bonus" DOUBLE PRECISION,
    "total_unit" DOUBLE PRECISION NOT NULL,
    "purchase_price" DOUBLE PRECISION NOT NULL,
    "unit_price" DOUBLE PRECISION,
    "sale_price" DOUBLE PRECISION NOT NULL,
    "prod_subtotal_amount" DOUBLE PRECISION NOT NULL,
    "discount_amount" DOUBLE PRECISION,
    "tax_amount" DOUBLE PRECISION,
    "total_discount_amount" DOUBLE PRECISION,
    "total_tax_amount" DOUBLE PRECISION,
    "batch" TEXT,
    "expiry" TIMESTAMP(3),
    "net_amount" DOUBLE PRECISION NOT NULL,
    "isTaxApplied" INTEGER NOT NULL DEFAULT 0,
    "isDiscountApplied" INTEGER NOT NULL DEFAULT 0,
    "isTaxPercentage" INTEGER NOT NULL DEFAULT 0,
    "isDiscountedPercentage" INTEGER NOT NULL DEFAULT 0,
    "isTaxAppliedCondition" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "purchase_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_return" (
    "purchase_return_id" SERIAL NOT NULL,
    "return_dat" TIMESTAMP(3) NOT NULL,
    "acc_id" INTEGER NOT NULL,
    "subtotal_amount" DOUBLE PRECISION NOT NULL,
    "total_discount" DOUBLE PRECISION NOT NULL,
    "bill_tax" DOUBLE PRECISION NOT NULL,
    "packing_fare" DOUBLE PRECISION NOT NULL,
    "loading_fare" DOUBLE PRECISION NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "received_amount" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "insert_dat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(3) NOT NULL,
    "insert_by" TEXT NOT NULL DEFAULT 'user 1',
    "update_by" TEXT NOT NULL DEFAULT 'user 1',

    CONSTRAINT "purchase_return_pkey" PRIMARY KEY ("purchase_return_id")
);

-- CreateTable
CREATE TABLE "purchase_return_detail" (
    "id" SERIAL NOT NULL,
    "purchase_return_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "return_type_id" INTEGER NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "packing" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "total_unit" DOUBLE PRECISION NOT NULL,
    "purchase_price" DOUBLE PRECISION NOT NULL,
    "unit_price" DOUBLE PRECISION,
    "sale_price" DOUBLE PRECISION NOT NULL,
    "prod_subtotal_amount" DOUBLE PRECISION NOT NULL,
    "discount_amount" DOUBLE PRECISION,
    "tax_amount" DOUBLE PRECISION,
    "total_discount_amount" DOUBLE PRECISION,
    "total_tax_amount" DOUBLE PRECISION,
    "batch" TEXT,
    "expiry" TIMESTAMP(3),
    "net_amount" DOUBLE PRECISION NOT NULL,
    "isTaxApplied" INTEGER NOT NULL DEFAULT 0,
    "isDiscountApplied" INTEGER NOT NULL DEFAULT 0,
    "isTaxPercentage" INTEGER NOT NULL DEFAULT 0,
    "isDiscountedPercentage" INTEGER NOT NULL DEFAULT 0,
    "isTaxAppliedCondition" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "purchase_return_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_return" (
    "sale_return_id" SERIAL NOT NULL,
    "return_dat" TIMESTAMP(3) NOT NULL,
    "acc_id" INTEGER NOT NULL,
    "subtotal_amount" DOUBLE PRECISION NOT NULL,
    "total_discount" DOUBLE PRECISION NOT NULL,
    "bill_tax" DOUBLE PRECISION NOT NULL,
    "packing_fare" DOUBLE PRECISION NOT NULL,
    "loading_fare" DOUBLE PRECISION NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "paid_amount" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "insert_dat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(3) NOT NULL,
    "insert_by" TEXT NOT NULL DEFAULT 'user 1',
    "update_by" TEXT NOT NULL DEFAULT 'user 1',

    CONSTRAINT "sale_return_pkey" PRIMARY KEY ("sale_return_id")
);

-- CreateTable
CREATE TABLE "sale_return_detail" (
    "id" SERIAL NOT NULL,
    "sale_return_id" INTEGER NOT NULL,
    "sale_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "return_type_id" INTEGER NOT NULL,
    "sale_price" DOUBLE PRECISION NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "packing" DOUBLE PRECISION NOT NULL,
    "total_unit" DOUBLE PRECISION NOT NULL,
    "prod_subtotal_amount" DOUBLE PRECISION NOT NULL,
    "discount_amount" DOUBLE PRECISION,
    "total_discount_amount" DOUBLE PRECISION,
    "tax_amount" DOUBLE PRECISION,
    "total_tax_amount" DOUBLE PRECISION,
    "net_amount" DOUBLE PRECISION NOT NULL,
    "isTaxApplied" INTEGER NOT NULL DEFAULT 0,
    "isDiscountApplied" INTEGER NOT NULL DEFAULT 0,
    "isTaxPercentage" INTEGER NOT NULL DEFAULT 0,
    "isDiscountedPercentage" INTEGER NOT NULL DEFAULT 0,
    "isTaxAppliedCondition" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sale_return_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_type" (
    "return_type_id" SERIAL NOT NULL,
    "return_type_nam" VARCHAR(100) NOT NULL,
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "return_type_pkey" PRIMARY KEY ("return_type_id")
);

-- CreateTable
CREATE TABLE "sale" (
    "sale_id" SERIAL NOT NULL,
    "sale_dat" TIMESTAMP(3) NOT NULL,
    "bill_by" INTEGER NOT NULL,
    "payment" INTEGER,
    "salesman_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "total_discount" DOUBLE PRECISION NOT NULL,
    "total_tax" DOUBLE PRECISION NOT NULL,
    "extra_tax" DOUBLE PRECISION,
    "packing_fare" DOUBLE PRECISION NOT NULL,
    "subtotal_amount" DOUBLE PRECISION NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "received_amount" DOUBLE PRECISION NOT NULL,
    "delivered_to" TEXT NOT NULL,
    "builty_number" TEXT NOT NULL,
    "ogp_number" TEXT NOT NULL,
    "remarks" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "insert_dat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(3) NOT NULL,
    "insert_by" TEXT NOT NULL DEFAULT 'user 1',
    "update_by" TEXT NOT NULL DEFAULT 'user 1',

    CONSTRAINT "sale_pkey" PRIMARY KEY ("sale_id")
);

-- CreateTable
CREATE TABLE "sale_detail" (
    "id" SERIAL NOT NULL,
    "sale_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "sale_price" DOUBLE PRECISION NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "packing" DOUBLE PRECISION NOT NULL,
    "bonus" DOUBLE PRECISION NOT NULL,
    "total_unit" DOUBLE PRECISION NOT NULL,
    "prod_subtotal_amount" DOUBLE PRECISION NOT NULL,
    "discount_amount" DOUBLE PRECISION,
    "total_discount_amount" DOUBLE PRECISION,
    "tax_amount" DOUBLE PRECISION,
    "total_tax_amount" DOUBLE PRECISION,
    "net_amount" DOUBLE PRECISION NOT NULL,
    "isTaxApplied" INTEGER NOT NULL DEFAULT 0,
    "isDiscountApplied" INTEGER NOT NULL DEFAULT 0,
    "isTaxPercentage" INTEGER NOT NULL DEFAULT 0,
    "isDiscountedPercentage" INTEGER NOT NULL DEFAULT 0,
    "isTaxAppliedCondition" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sale_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation" (
    "quotation_id" SERIAL NOT NULL,
    "salesman_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "subtotal_amount" DOUBLE PRECISION NOT NULL,
    "total_discount" DOUBLE PRECISION NOT NULL,
    "total_tax" DOUBLE PRECISION NOT NULL,
    "extra_tax" DOUBLE PRECISION,
    "packing_fare" DOUBLE PRECISION NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "insert_dat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(3) NOT NULL,
    "insert_by" TEXT NOT NULL DEFAULT 'user 1',
    "update_by" TEXT NOT NULL DEFAULT 'user 1',

    CONSTRAINT "quotation_pkey" PRIMARY KEY ("quotation_id")
);

-- CreateTable
CREATE TABLE "quotation_detail" (
    "id" SERIAL NOT NULL,
    "quotation_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "sale_price" DOUBLE PRECISION NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "packing" DOUBLE PRECISION NOT NULL,
    "bonus" DOUBLE PRECISION,
    "total_unit" DOUBLE PRECISION NOT NULL,
    "prod_subtotal_amount" DOUBLE PRECISION NOT NULL,
    "discount_amount" DOUBLE PRECISION,
    "total_discount_amount" DOUBLE PRECISION,
    "tax_amount" DOUBLE PRECISION,
    "total_tax_amount" DOUBLE PRECISION,
    "net_amount" DOUBLE PRECISION NOT NULL,
    "isTaxApplied" INTEGER NOT NULL DEFAULT 0,
    "isDiscountApplied" INTEGER NOT NULL DEFAULT 0,
    "isTaxPercentage" INTEGER NOT NULL DEFAULT 0,
    "isDiscountedPercentage" INTEGER NOT NULL DEFAULT 0,
    "isTaxAppliedCondition" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quotation_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle" (
    "vehicle_id" SERIAL NOT NULL,
    "vehicle_type_id" INTEGER NOT NULL,
    "vehicle_nam" VARCHAR(100) NOT NULL,
    "vehicle_plate" VARCHAR(100) NOT NULL,
    "driver_id" INTEGER,
    "deliveryman_id" INTEGER,
    "is_assigned" INTEGER NOT NULL DEFAULT 0,
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("vehicle_id")
);

-- CreateTable
CREATE TABLE "vehicle_type" (
    "vehicle_type_id" SERIAL NOT NULL,
    "vehicle_type_nam" VARCHAR(100) NOT NULL,
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vehicle_type_pkey" PRIMARY KEY ("vehicle_type_id")
);

-- CreateTable
CREATE TABLE "area_assignment" (
    "assignment_id" SERIAL NOT NULL,
    "area_id" INTEGER NOT NULL,
    "acc_id" INTEGER NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "is_active" INTEGER NOT NULL DEFAULT 1,
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "area_assignment_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateTable
CREATE TABLE "account_head" (
    "head_id" SERIAL NOT NULL,
    "head_nam" VARCHAR(100) NOT NULL,

    CONSTRAINT "account_head_pkey" PRIMARY KEY ("head_id")
);

-- CreateTable
CREATE TABLE "account_sub_head" (
    "sub_id" SERIAL NOT NULL,
    "head_id" INTEGER NOT NULL,
    "subhead_id" INTEGER NOT NULL,
    "subhead_nam" VARCHAR(100) NOT NULL,
    "is_parent" INTEGER NOT NULL DEFAULT 0,
    "parent_sub_id" INTEGER,
    "insert_dat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(3) NOT NULL,
    "insert_by" TEXT NOT NULL DEFAULT 'user 1',
    "update_by" TEXT NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "account_sub_head_pkey" PRIMARY KEY ("sub_id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "acc_id" SERIAL NOT NULL,
    "head_id" INTEGER NOT NULL,
    "sub_id" INTEGER NOT NULL,
    "account_id" INTEGER NOT NULL,
    "account_nam" VARCHAR(100) NOT NULL,
    "account_cnic" VARCHAR(100),
    "account_address" VARCHAR(255),
    "account_alter_nam" VARCHAR(100),
    "account_contact" VARCHAR(50),
    "account_reference" VARCHAR(255),
    "account_no" VARCHAR(100),
    "is_employee" INTEGER NOT NULL DEFAULT 0,
    "is_driver" INTEGER NOT NULL DEFAULT 0,
    "is_delivery_man" INTEGER NOT NULL DEFAULT 0,
    "is_customer" INTEGER NOT NULL DEFAULT 0,
    "is_supplier" INTEGER NOT NULL DEFAULT 0,
    "is_salesman" INTEGER NOT NULL DEFAULT 0,
    "credit_limit" DECIMAL(15,2),
    "cgroup_id" INTEGER,
    "subarea_id" INTEGER,
    "company_id" INTEGER,
    "designation_id" INTEGER,
    "insert_dat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(3) NOT NULL,
    "insert_by" TEXT NOT NULL DEFAULT 'user 1',
    "update_by" TEXT NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("acc_id")
);

-- CreateTable
CREATE TABLE "account_manage" (
    "m_id" SERIAL NOT NULL,
    "head_id" INTEGER NOT NULL,
    "sub_id" INTEGER NOT NULL,
    "acc_id" INTEGER,
    "description" VARCHAR(255) NOT NULL,
    "account_lvl" INTEGER NOT NULL,
    "display_category" INTEGER NOT NULL DEFAULT 0,
    "is_active" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "account_manage_pkey" PRIMARY KEY ("m_id")
);

-- CreateTable
CREATE TABLE "screen_code" (
    "screen_id" SERIAL NOT NULL,
    "screen_nam" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "screen_type" VARCHAR(100) NOT NULL,
    "is_save" INTEGER NOT NULL DEFAULT 0,
    "is_modify" INTEGER NOT NULL DEFAULT 0,
    "is_read" INTEGER NOT NULL DEFAULT 0,
    "group_id" INTEGER NOT NULL,
    "display_order" INTEGER NOT NULL,

    CONSTRAINT "screen_code_pkey" PRIMARY KEY ("screen_id")
);

-- CreateTable
CREATE TABLE "screen_group" (
    "group_id" SERIAL NOT NULL,
    "group_nam" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "display_order" INTEGER NOT NULL,
    "is_parent" INTEGER NOT NULL DEFAULT 0,
    "parent_id" INTEGER,

    CONSTRAINT "screen_group_pkey" PRIMARY KEY ("group_id")
);

-- CreateTable
CREATE TABLE "transaction" (
    "t_id" SERIAL NOT NULL,
    "record_no" INTEGER,
    "company_id" INTEGER,
    "reference_id" INTEGER,
    "acc_id" INTEGER NOT NULL,
    "transaction_dat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "financial_year" TEXT,
    "voucher_type" TEXT,
    "reference" TEXT NOT NULL,
    "debit" DOUBLE PRECISION NOT NULL,
    "credit" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "manual_voucher_no" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "insert_dat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(3) NOT NULL,
    "insert_by" TEXT NOT NULL DEFAULT 'user 1',
    "update_by" TEXT NOT NULL DEFAULT 'user 1',

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("t_id")
);

-- CreateTable
CREATE TABLE "voucher" (
    "v_id" SERIAL NOT NULL,
    "voucher_id" INTEGER NOT NULL,
    "company_id" INTEGER,
    "record_no" INTEGER NOT NULL,
    "acc_id" INTEGER NOT NULL,
    "transaction_dat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "financial_year" TEXT NOT NULL,
    "voucher_type" TEXT NOT NULL,
    "debit" DOUBLE PRECISION NOT NULL,
    "credit" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "manual_voucher_no" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "insert_dat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(3) NOT NULL,
    "insert_by" TEXT NOT NULL DEFAULT 'user 1',
    "update_by" TEXT NOT NULL DEFAULT 'user 1',

    CONSTRAINT "voucher_pkey" PRIMARY KEY ("v_id")
);

-- CreateTable
CREATE TABLE "farm" (
    "farm_id" SERIAL NOT NULL,
    "farm_nam" VARCHAR(100) NOT NULL,
    "capacity" DOUBLE PRECISION,
    "address" VARCHAR(255),
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "farm_pkey" PRIMARY KEY ("farm_id")
);

-- CreateTable
CREATE TABLE "floc" (
    "floc_id" SERIAL NOT NULL,
    "farm_id" INTEGER NOT NULL,
    "starting_date" TIMESTAMP(3) NOT NULL,
    "ending_date" TIMESTAMP(3),
    "stackholders" JSONB NOT NULL,
    "clear_description" VARCHAR(500),
    "insert_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_dat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "update_by" VARCHAR(50) NOT NULL DEFAULT 'user 1',
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "floc_pkey" PRIMARY KEY ("floc_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "uq_company_name" ON "pro_company"("company_nam");

-- CreateIndex
CREATE UNIQUE INDEX "uq_type_name" ON "pro_category"("procategory_nam");

-- CreateIndex
CREATE UNIQUE INDEX "uq_unit_name" ON "pro_unit"("prounit_nam");

-- CreateIndex
CREATE UNIQUE INDEX "uq_customergroup_name" ON "customer_group"("cgroup_nam");

-- CreateIndex
CREATE UNIQUE INDEX "uq_designation_name" ON "employee_designation"("designation_nam");

-- CreateIndex
CREATE UNIQUE INDEX "uq_warehouse_name" ON "warehouse"("warehouse_nam");

-- CreateIndex
CREATE UNIQUE INDEX "uq_productgroup_name" ON "product_group"("pgroup_nam");

-- CreateIndex
CREATE UNIQUE INDEX "uq_product_title" ON "product"("product_title");

-- CreateIndex
CREATE INDEX "idx_materials_company_id" ON "product"("company_id");

-- CreateIndex
CREATE INDEX "idx_materials_category_id" ON "product"("procategory_id");

-- CreateIndex
CREATE INDEX "idx_materials_unit_id" ON "product"("prounit_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_return_type_name" ON "return_type"("return_type_nam");

-- CreateIndex
CREATE UNIQUE INDEX "uq_vehicle_plate" ON "vehicle"("vehicle_plate");

-- CreateIndex
CREATE UNIQUE INDEX "uq_driver_id" ON "vehicle"("driver_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_deliveryman_id" ON "vehicle"("deliveryman_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_vehicle_type_name" ON "vehicle_type"("vehicle_type_nam");

-- CreateIndex
CREATE INDEX "area_assignment_acc_id_idx" ON "area_assignment"("acc_id");

-- CreateIndex
CREATE INDEX "area_assignment_vehicle_id_idx" ON "area_assignment"("vehicle_id");

-- CreateIndex
CREATE INDEX "area_assignment_is_active_idx" ON "area_assignment"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "area_assignment_area_id_is_active_key" ON "area_assignment"("area_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "account_head_head_nam_key" ON "account_head"("head_nam");

-- CreateIndex
CREATE INDEX "account_sub_head_head_id_idx" ON "account_sub_head"("head_id");

-- CreateIndex
CREATE INDEX "account_sub_head_parent_sub_id_idx" ON "account_sub_head"("parent_sub_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_sub_head_head_id_subhead_id_key" ON "account_sub_head"("head_id", "subhead_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_account_cnic_key" ON "accounts"("account_cnic");

-- CreateIndex
CREATE INDEX "accounts_head_id_idx" ON "accounts"("head_id");

-- CreateIndex
CREATE INDEX "accounts_sub_id_idx" ON "accounts"("sub_id");

-- CreateIndex
CREATE INDEX "accounts_is_customer_idx" ON "accounts"("is_customer");

-- CreateIndex
CREATE INDEX "accounts_is_supplier_idx" ON "accounts"("is_supplier");

-- CreateIndex
CREATE INDEX "accounts_is_salesman_idx" ON "accounts"("is_salesman");

-- CreateIndex
CREATE INDEX "accounts_cgroup_id_idx" ON "accounts"("cgroup_id");

-- CreateIndex
CREATE INDEX "accounts_designation_id_idx" ON "accounts"("designation_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_sub_id_account_id_key" ON "accounts"("sub_id", "account_id");

-- CreateIndex
CREATE INDEX "account_manage_acc_id_idx" ON "account_manage"("acc_id");

-- CreateIndex
CREATE INDEX "account_manage_description_idx" ON "account_manage"("description");

-- CreateIndex
CREATE INDEX "account_manage_head_id_idx" ON "account_manage"("head_id");

-- CreateIndex
CREATE INDEX "account_manage_sub_id_idx" ON "account_manage"("sub_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_manage_description_is_active_key" ON "account_manage"("description", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "uq_screen_name" ON "screen_code"("screen_nam");

-- CreateIndex
CREATE UNIQUE INDEX "uq_group_name" ON "screen_group"("group_nam");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_company_id_key" ON "transaction"("company_id");

-- CreateIndex
CREATE INDEX "transaction_reference_id_record_no_idx" ON "transaction"("reference_id", "record_no");

-- CreateIndex
CREATE INDEX "transaction_acc_id_idx" ON "transaction"("acc_id");

-- CreateIndex
CREATE INDEX "transaction_isDeleted_idx" ON "transaction"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_reference_id_t_id_key" ON "transaction"("reference_id", "t_id");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_company_id_key" ON "voucher"("company_id");

-- CreateIndex
CREATE INDEX "voucher_voucher_id_record_no_idx" ON "voucher"("voucher_id", "record_no");

-- CreateIndex
CREATE INDEX "voucher_acc_id_idx" ON "voucher"("acc_id");

-- CreateIndex
CREATE INDEX "voucher_financial_year_idx" ON "voucher"("financial_year");

-- CreateIndex
CREATE INDEX "voucher_isDeleted_idx" ON "voucher"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_v_id_voucher_id_key" ON "voucher"("v_id", "voucher_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_farm_name" ON "farm"("farm_nam");

-- CreateIndex
CREATE INDEX "floc_farm_id_idx" ON "floc"("farm_id");

-- CreateIndex
CREATE INDEX "floc_starting_date_idx" ON "floc"("starting_date");

-- CreateIndex
CREATE INDEX "floc_ending_date_idx" ON "floc"("ending_date");

-- AddForeignKey
ALTER TABLE "pro_category" ADD CONSTRAINT "pro_category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "pro_category"("procategory_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pro_unit" ADD CONSTRAINT "pro_unit_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "pro_unit"("prounit_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "fk_materials_company_relation" FOREIGN KEY ("company_id") REFERENCES "pro_company"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "fk_materials_type_relation" FOREIGN KEY ("procategory_id") REFERENCES "pro_category"("procategory_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "fk_materials_unit_relation" FOREIGN KEY ("prounit_id") REFERENCES "pro_unit"("prounit_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "fk_materials_product_group_relation" FOREIGN KEY ("pgroup_id") REFERENCES "product_group"("pgroup_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_acc_id_fkey" FOREIGN KEY ("acc_id") REFERENCES "accounts"("acc_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_detail" ADD CONSTRAINT "purchase_detail_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchase"("purchase_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_detail" ADD CONSTRAINT "purchase_detail_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_return" ADD CONSTRAINT "purchase_return_acc_id_fkey" FOREIGN KEY ("acc_id") REFERENCES "accounts"("acc_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_return_detail" ADD CONSTRAINT "purchase_return_detail_purchase_return_id_fkey" FOREIGN KEY ("purchase_return_id") REFERENCES "purchase_return"("purchase_return_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_return_detail" ADD CONSTRAINT "purchase_return_detail_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_return_detail" ADD CONSTRAINT "purchase_return_detail_return_type_id_fkey" FOREIGN KEY ("return_type_id") REFERENCES "return_type"("return_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_return" ADD CONSTRAINT "sale_return_acc_id_fkey" FOREIGN KEY ("acc_id") REFERENCES "accounts"("acc_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_return_detail" ADD CONSTRAINT "sale_return_detail_sale_return_id_fkey" FOREIGN KEY ("sale_return_id") REFERENCES "sale_return"("sale_return_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_return_detail" ADD CONSTRAINT "sale_return_detail_return_type_id_fkey" FOREIGN KEY ("return_type_id") REFERENCES "return_type"("return_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_return_detail" ADD CONSTRAINT "sale_return_detail_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale" ADD CONSTRAINT "sale_salesman_id_fkey" FOREIGN KEY ("salesman_id") REFERENCES "accounts"("acc_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale" ADD CONSTRAINT "sale_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "accounts"("acc_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_detail" ADD CONSTRAINT "sale_detail_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sale"("sale_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_detail" ADD CONSTRAINT "sale_detail_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation" ADD CONSTRAINT "quotation_salesman_id_fkey" FOREIGN KEY ("salesman_id") REFERENCES "accounts"("acc_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation" ADD CONSTRAINT "quotation_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "accounts"("acc_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_detail" ADD CONSTRAINT "quotation_detail_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotation"("quotation_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_detail" ADD CONSTRAINT "quotation_detail_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "accounts"("acc_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_deliveryman_id_fkey" FOREIGN KEY ("deliveryman_id") REFERENCES "accounts"("acc_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_type"("vehicle_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "area_assignment" ADD CONSTRAINT "area_assignment_acc_id_fkey" FOREIGN KEY ("acc_id") REFERENCES "accounts"("acc_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "area_assignment" ADD CONSTRAINT "area_assignment_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle"("vehicle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_sub_head" ADD CONSTRAINT "account_sub_head_head_id_fkey" FOREIGN KEY ("head_id") REFERENCES "account_head"("head_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_sub_head" ADD CONSTRAINT "account_sub_head_parent_sub_id_fkey" FOREIGN KEY ("parent_sub_id") REFERENCES "account_sub_head"("sub_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_head_id_fkey" FOREIGN KEY ("head_id") REFERENCES "account_head"("head_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_sub_id_fkey" FOREIGN KEY ("sub_id") REFERENCES "account_sub_head"("sub_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_cgroup_id_fkey" FOREIGN KEY ("cgroup_id") REFERENCES "customer_group"("cgroup_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "pro_company"("company_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_designation_id_fkey" FOREIGN KEY ("designation_id") REFERENCES "employee_designation"("designation_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_manage" ADD CONSTRAINT "account_manage_head_id_fkey" FOREIGN KEY ("head_id") REFERENCES "account_head"("head_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_manage" ADD CONSTRAINT "account_manage_sub_id_fkey" FOREIGN KEY ("sub_id") REFERENCES "account_sub_head"("sub_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_manage" ADD CONSTRAINT "account_manage_acc_id_fkey" FOREIGN KEY ("acc_id") REFERENCES "accounts"("acc_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screen_code" ADD CONSTRAINT "fk_screen_group_screen_code" FOREIGN KEY ("group_id") REFERENCES "screen_group"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_acc_id_fkey" FOREIGN KEY ("acc_id") REFERENCES "accounts"("acc_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "pro_company"("company_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher" ADD CONSTRAINT "voucher_acc_id_fkey" FOREIGN KEY ("acc_id") REFERENCES "accounts"("acc_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher" ADD CONSTRAINT "voucher_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "pro_company"("company_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floc" ADD CONSTRAINT "floc_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farm"("farm_id") ON DELETE RESTRICT ON UPDATE CASCADE;
