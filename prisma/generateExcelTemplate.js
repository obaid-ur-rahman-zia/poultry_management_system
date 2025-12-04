import XLSX from "xlsx";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Parse Prisma schema file and extract model definitions
 */
function parsePrismaSchema(schemaPath) {
  const schemaContent = readFileSync(schemaPath, "utf-8");
  const models = {};
  
  // Find all model blocks by matching braces properly
  const modelRegex = /model\s+(\w+)\s*\{/g;
  let match;
  const modelPositions = [];
  
  while ((match = modelRegex.exec(schemaContent)) !== null) {
    modelPositions.push({
      name: match[1],
      start: match.index + match[0].length - 1, // Position of opening brace
    });
  }
  
  // Extract each model's body by matching braces
  for (let i = 0; i < modelPositions.length; i++) {
    const model = modelPositions[i];
    
    let braceCount = 0;
    let bodyStart = -1;
    let bodyEnd = -1;
    
    // Start from the opening brace of this model
    for (let j = model.start; j < schemaContent.length; j++) {
      if (schemaContent[j] === '{') {
        if (braceCount === 0) bodyStart = j + 1;
        braceCount++;
      } else if (schemaContent[j] === '}') {
        braceCount--;
        if (braceCount === 0) {
          bodyEnd = j;
          break;
        }
      }
    }
    
    if (bodyStart === -1 || bodyEnd === -1) {
      console.log(`⚠️  Warning: Could not parse model "${model.name}"`);
      continue;
    }
    
    const modelBody = schemaContent.substring(bodyStart, bodyEnd);
    const fields = {};
    
    // Parse fields line by line
    const lines = modelBody.split('\n');
    let currentField = null;
    let currentFieldDef = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('//')) continue;
      
      // Check if this is a relation field (has @relation and is not a foreign key field)
      // Relation fields typically look like: "farm farm @relation(...)" or "products product[]"
      // Foreign keys look like: "farm_id Int" and should be included
      const isRelationField = trimmed.includes('@relation') && 
        !trimmed.match(/^\w+_id\s+/); // Not a foreign key (doesn't end with _id)
      
      if (isRelationField) {
        // Skip this relation field entirely
        currentField = null;
        currentFieldDef = '';
        continue;
      }
      
      // Check if this is a field definition (starts with word, then type)
      const fieldMatch = trimmed.match(/^(\w+)\s+([^\s]+(?:\s+[^\s]+)*)/);
      
      if (fieldMatch) {
        // Save previous field if exists
        if (currentField) {
          const fieldDef = currentFieldDef.trim();
          if (!shouldSkipField(currentField, fieldDef)) {
            const columnName = currentField
              .replace(/_/g, " ")
              .replace(/\b\w/g, (char) => char.toUpperCase());
            fields[currentField] = columnName;
          }
        }
        
        // Start new field
        currentField = fieldMatch[1];
        currentFieldDef = fieldMatch[2];
      } else if (currentField) {
        // Continuation of current field (multi-line)
        // Check if it contains @relation - if so, skip this field
        if (trimmed.includes('@relation')) {
          currentField = null;
          currentFieldDef = '';
          continue;
        }
        currentFieldDef += ' ' + trimmed;
      }
    }
    
    // Save last field
    if (currentField) {
      const fieldDef = currentFieldDef.trim();
      if (!shouldSkipField(currentField, fieldDef)) {
        const columnName = currentField
          .replace(/_/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());
        fields[currentField] = columnName;
      }
    }
    
    // Only add models that have fields
    if (Object.keys(fields).length > 0) {
      models[model.name] = {
        fields,
        modelName: model.name,
      };
    }
  }
  
  return models;
}

/**
 * Determine if a field should be skipped (auto-generated, relations, etc.)
 */
function shouldSkipField(fieldName, fieldDef) {
  // Skip relation fields (these are the actual relation definitions, not foreign keys)
  if (fieldDef.includes("@relation") || fieldDef.includes("@@")) {
    return true;
  }
  
  // Skip array types that are typically relations (e.g., "product[]", "accounts[]")
  // These are relation fields defined on the "many" side
  if (fieldDef.match(/\w+\[\]/)) {
    return true;
  }
  
  // Skip id fields that are auto-increment
  if (fieldDef.includes("@id") && fieldDef.includes("@default(autoincrement())")) {
    return true;
  }
  
  // Skip timestamp fields that are auto-generated
  if (fieldDef.includes("@default(now())") || fieldDef.includes("@updatedAt")) {
    return true;
  }
  
  // Skip status fields with default values (optional for seeding)
  if (fieldName === "status" && fieldDef.includes("@default")) {
    return true;
  }
  
  // Skip auto-generated metadata fields
  if (["insert_by", "update_by", "insert_dat", "update_dat", "created_at", "updated_at"].includes(fieldName)) {
    return true;
  }
  
  return false;
}

/**
 * Convert model name to Excel sheet name
 */
function modelNameToSheetName(modelName) {
  // Convert snake_case to Title Case with spaces
  return modelName
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

/**
 * Determine if field needs transformation based on type
 */
function getFieldTransform(fieldName, fieldDef) {
  // Check if it's a number type
  if (fieldDef.includes("Int") || fieldDef.includes("Float") || fieldDef.includes("Decimal")) {
    if (fieldDef.includes("?")) {
      // Optional number - can be null
      return (val) => val === "" || val === null || val === undefined ? null : 
        fieldDef.includes("Float") || fieldDef.includes("Decimal") ? parseFloat(val) : parseInt(val);
    } else {
      // Required number
      return (val) => fieldDef.includes("Float") || fieldDef.includes("Decimal") ? parseFloat(val) : parseInt(val);
    }
  }
  
  // Check if it's a boolean (Int with default 0/1)
  if (fieldDef.includes("Int") && (fieldDef.includes("@default(0)") || fieldDef.includes("@default(1)"))) {
    return (val) => val === 1 || val === "1" || val === true || val === "true" ? 1 : 0;
  }
  
  // Check if it's a DateTime
  if (fieldDef.includes("DateTime")) {
    return (val) => val === "" || val === null || val === undefined ? null : new Date(val);
  }
  
  // Check if it's JSON
  if (fieldDef.includes("Json")) {
    return (val) => {
      if (!val || val === "") return JSON.stringify([]);
      try {
        if (typeof val === "string") {
          const parsed = JSON.parse(val);
          return JSON.stringify(parsed);
        }
        return JSON.stringify(val);
      } catch {
        return JSON.stringify([]);
      }
    };
  }
  
  return null;
}

/**
 * Generate Excel template with all sheets and headers from Prisma schema
 */
function generateExcelTemplate() {
  console.log("📝 Generating Excel template from Prisma schema...\n");
  
  const schemaPath = join(__dirname, "schema.prisma");
  const models = parsePrismaSchema(schemaPath);
  
  console.log(`📊 Found ${Object.keys(models).length} models in schema\n`);
  
  const workbook = XLSX.utils.book_new();
  let sheetCount = 0;
  
  // Create a worksheet for each model
  for (const [modelName, modelData] of Object.entries(models)) {
    const sheetName = modelNameToSheetName(modelName);
    const fields = modelData.fields;
    
    if (Object.keys(fields).length === 0) {
      console.log(`⚠️  Skipping "${sheetName}" - no seedable fields`);
      continue;
    }
    
    console.log(`Creating sheet: "${sheetName}" (${Object.keys(fields).length} fields)`);
    
    // Get all column names (Excel column names from fields)
    const columnNames = Object.values(fields);
    
    // Create worksheet with headers
    const worksheetData = [columnNames]; // First row is headers
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths (auto-width based on header length)
    const colWidths = columnNames.map((colName) => ({
      wch: Math.max(colName.length + 2, 15), // Minimum width 15, or header length + 2
    }));
    worksheet["!cols"] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    sheetCount++;
  }
  
  // Write file
  const outputPath = join(__dirname, "excel_sheets", "seed_data.xlsx");
  
  try {
    XLSX.writeFile(workbook, outputPath);
    console.log(`\n✅ Excel template created successfully!`);
    console.log(`📁 Location: ${outputPath}`);
    console.log(`\n📊 Created ${sheetCount} sheets from ${Object.keys(models).length} models`);
    console.log(`\n💡 You can now fill in the data in each sheet and run: npm run db:seed`);
  } catch (error) {
    if (error.code === "EBUSY" || error.errno === -4082) {
      console.error(`\n❌ Error: The Excel file is currently open.`);
      console.error(`   Please close "${outputPath}" and try again.`);
    } else {
      console.error(`\n❌ Error writing file:`, error.message);
    }
    throw error;
  }
}

// Run the generator
try {
  generateExcelTemplate();
} catch (error) {
  console.error("❌ Error generating template:", error);
  process.exit(1);
}
