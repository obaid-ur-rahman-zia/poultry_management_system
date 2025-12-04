# Excel Seeding Guide

This guide explains how to seed your database from Excel files.

## Setup

The Excel seeding script is already configured. You just need to create an Excel file with the appropriate sheets.

## Available Sheet Names

The following sheet names are supported (case-sensitive):

1. **Account Heads** - Account head records
2. **Account Sub Heads** - Account subhead records
3. **Accounts** - Account records
4. **Account Manage** - Account management records
5. **Products** - Product records
6. **Companies** - Company records
7. **Categories** - Product category records
8. **Units** - Product unit records
9. **Product Groups** - Product group records
10. **Warehouses** - Warehouse records
11. **Customer Groups** - Customer group records
12. **Employee Designations** - Employee designation records
13. **Vehicle Types** - Vehicle type records
14. **Vehicles** - Vehicle records
15. **Return Types** - Return type records
16. **Farms** - Farm records
17. **Flocs** - Floc records (with JSON stackholders)
18. **Area Assignments** - Area assignment records
19. **Screen Groups** - Screen group records
20. **Screen Codes** - Screen code records
21. **Users** - User records

## Excel File Format

Create an Excel file named `seed_data.xlsx` in the `prisma/excel_sheets/` directory with the following sheets:

### 1. Account Heads Sheet
**Sheet Name:** `Account Heads`

| Name |
|------|
| Main Head |
| Assets |
| Liabilities |

### 2. Account Sub Heads Sheet
**Sheet Name:** `Account Sub Heads`

| Head ID | Subhead ID | Name | Is Parent | Parent Sub ID |
|---------|------------|------|-----------|---------------|
| 1 | 1 | Former | 0 | |
| 1 | 2 | Purcher | 0 | |
| 1 | 11 | Bank | 0 | |

### 3. Accounts Sheet
**Sheet Name:** `Accounts`

| Head ID | Sub ID | Account ID | Account Name | CNIC | Address | Contact | Account Number | Is Customer | Is Supplier | Credit Limit |
|---------|--------|------------|--------------|------|---------|---------|----------------|-------------|--------------|--------------|
| 1 | 11 | 1 | HBL Bank | | | | 123456789 | 0 | 0 | |
| 1 | 2 | 1 | Supplier ABC | 12345-1234567-1 | Address here | 03001234567 | | 0 | 1 | 50000 |

**Note:** 
- Use `1` or `true` for boolean fields (Is Customer, Is Supplier, etc.)
- Leave empty for optional fields
- Account ID should be sequential per Sub ID (1, 2, 3... resets per Sub ID)

### 4. Products Sheet
**Sheet Name:** `Products`

| Product Title | Price | Company ID | Category ID | Unit ID |
|---------------|-------|------------|-------------|---------|
| Chicken Feed | 5000 | 1 | 1 | 1 |
| Medicine A | 1500 | 2 | 2 | 2 |

### 5. Companies Sheet
**Sheet Name:** `Companies`

| Company Name |
|-------------|
| Company A |
| Company B |

### 6. Categories Sheet
**Sheet Name:** `Categories`

| Category Name | Parent ID | Is Parent |
|---------------|-----------|-----------|
| Feed | | 0 |
| Medicine | | 0 |

### 7. Farms Sheet
**Sheet Name:** `Farms`

| Farm Name | Capacity | Address |
|-----------|---------|---------|
| Farm 1 | 10000 | Address here |
| Farm 2 | 15000 | Address 2 |

### 8. Units Sheet
**Sheet Name:** `Units`

| Unit Name | Parent ID | Is Parent |
|-----------|-----------|-----------|
| Kilogram | | 0 |
| Gram | 1 | 0 |

### 9. Product Groups Sheet
**Sheet Name:** `Product Groups`

| Product Group Name |
|-------------------|
| Feed Group |
| Medicine Group |

### 10. Warehouses Sheet
**Sheet Name:** `Warehouses`

| Warehouse Name |
|----------------|
| Main Warehouse |
| Secondary Warehouse |

### 11. Customer Groups Sheet
**Sheet Name:** `Customer Groups`

| Customer Group Name |
|-------------------|
| Premium |
| Regular |

### 12. Employee Designations Sheet
**Sheet Name:** `Employee Designations`

| Designation Name |
|-----------------|
| Manager |
| Sales Executive |

### 13. Vehicle Types Sheet
**Sheet Name:** `Vehicle Types`

| Vehicle Type Name |
|------------------|
| Truck |
| Van |

### 14. Vehicles Sheet
**Sheet Name:** `Vehicles`

| Vehicle Type ID | Vehicle Name | Vehicle Plate | Driver ID | Deliveryman ID | Is Assigned |
|-----------------|--------------|---------------|-----------|----------------|-------------|
| 1 | Delivery Truck 1 | ABC-123 | 1 | 2 | 1 |
| 1 | Delivery Truck 2 | XYZ-456 | | | 0 |

### 15. Return Types Sheet
**Sheet Name:** `Return Types`

| Return Type Name |
|-----------------|
| Expired |
| Damaged |
| Other |

### 16. Flocs Sheet
**Sheet Name:** `Flocs`

| Farm ID | Starting Date | Ending Date | Stackholders | Clear Description |
|---------|---------------|-------------|--------------|-------------------|
| 1 | 2024-01-01 | 2024-12-31 | [{"acc_id":1,"percentage":50},{"acc_id":2,"percentage":50}] | |
| 2 | 2024-02-01 | | [{"acc_id":1,"percentage":100}] | |

**Note:** Stackholders must be a valid JSON array string.

### 17. Area Assignments Sheet
**Sheet Name:** `Area Assignments`

| Area ID | Account ID | Vehicle ID | Is Active | Status |
|---------|------------|------------|-----------|--------|
| 1 | 5 | 1 | 1 | 1 |
| 2 | 6 | 2 | 1 | 1 |

### 18. Screen Groups Sheet
**Sheet Name:** `Screen Groups`

| Group Name | Description | Display Order | Is Parent | Parent ID |
|------------|------------|---------------|-----------|-----------|
| Administration | Admin screens | 1 | 0 | |
| Reports | Report screens | 2 | 0 | |

### 19. Screen Codes Sheet
**Sheet Name:** `Screen Codes`

| Screen Name | Description | Screen Type | Is Save | Is Modify | Is Read | Group ID | Display Order |
|-------------|-------------|-------------|---------|-----------|---------|-----------|---------------|
| User Management | Manage users | page | 1 | 1 | 1 | 1 | 1 |
| Account Management | Manage accounts | page | 1 | 1 | 1 | 1 | 2 |

### 20. Users Sheet
**Sheet Name:** `Users`

| User Name | Email | Password | Role | Profile Picture | Phone | Address | Status |
|-----------|-------|----------|------|-----------------|-------|---------|--------|
| Admin User | admin@example.com | $2b$10$... | SUPER_ADMIN | | 03001234567 | | 1 |

**Note:** Password should be bcrypt hashed. Role must be: SUPER_ADMIN, ADMIN, or USER.

### 21. Account Manage Sheet
**Sheet Name:** `Account Manage`

| Head ID | Sub ID | Account ID | Description | Account Level | Display Category | Is Active |
|---------|--------|------------|-------------|---------------|------------------|-----------|
| 1 | 2 | 1 | Cash In Hand | 3 | 0 | 1 |
| 1 | 2 | | Cash Accounts | 2 | 1 | 1 |

## Running the Seeder

### Option 1: Using the default file (`prisma/seed_data.xlsx`)
```bash
node prisma/seedFromExcel.js
```

### Option 2: Specify a custom Excel file path
```bash
node prisma/seedFromExcel.js path/to/your/file.xlsx
```

## Adding New Sheet Types

To add support for new sheet types, edit `prisma/seedFromExcel.js` and add a new entry to the `SHEET_CONFIG` object:

```javascript
"Your Sheet Name": {
  model: "your_model_name", // Prisma model name (lowercase, use underscore)
  fields: {
    db_field_name: "Excel Column Name",
    // ... more fields
  },
  transforms: {
    // Optional: transform functions for specific fields
    db_field_name: (val) => parseInt(val),
  },
},
```

## Notes

- The script uses `skipDuplicates: true`, so running it multiple times won't create duplicates
- Empty rows are automatically skipped
- The script will show detailed logs of what's being processed
- If bulk insert fails, it will try inserting records one by one to identify problematic records

## Example Excel File Structure

```
seed_data.xlsx
├── Account Heads (sheet)
├── Account Sub Heads (sheet)
├── Accounts (sheet)
├── Products (sheet)
├── Companies (sheet)
├── Categories (sheet)
└── Farms (sheet)
```

You don't need to include all sheets - only include the ones you want to seed.

