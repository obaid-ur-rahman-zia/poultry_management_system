import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Parse Prisma schema file and extract models with all fields
 */
export function parsePrismaSchema(schemaPath) {
  const schemaContent = readFileSync(schemaPath, "utf-8");
  const models = {};
  
  // Split by model blocks
  const modelBlocks = schemaContent.split(/^model\s+/gm);
  
  for (let i = 1; i < modelBlocks.length; i++) {
    const block = modelBlocks[i];
    const firstLine = block.split('\n')[0];
    const modelName = firstLine.trim().split(/\s+/)[0];
    
    // Extract the model body (everything between { and })
    const bodyMatch = block.match(/\{([\s\S]*)\}/);
    if (!bodyMatch) continue;
    
    const modelBody = bodyMatch[1];
    const fields = {};
    
    // Split by lines and process each field
    const lines = modelBody.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines, comments, and constraints
      if (!trimmedLine || 
          trimmedLine.startsWith('//') || 
          trimmedLine.startsWith('@@') ||
          trimmedLine.startsWith('@@index') ||
          trimmedLine.startsWith('@@unique')) {
        continue;
      }
      
      // Check if this is a relation field (contains @relation or [])
      if (trimmedLine.includes('@relation') || 
          trimmedLine.includes('[]') ||
          trimmedLine.includes('@id @default(autoincrement())')) {
        continue;
      }
      
      // Check if line contains a field definition
      // Field format: field_name field_type attributes
      const fieldMatch = trimmedLine.match(/^(\w+)\s+([^\n]+)/);
      
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const restOfLine = fieldMatch[2];
        
        // Skip auto-generated and system fields
        const skipFields = [
          'insert_dat', 'update_dat', 'insert_by', 'update_by', 'status',
          'isDeleted', 'is_edited', 'is_deleted', 'created_at', 'updated_at'
        ];
        
        if (skipFields.includes(fieldName)) {
          continue;
        }
        
        // Skip auto-increment primary keys (but keep sequential IDs like account_id, subhead_id)
        if ((fieldName === 'id' || 
             (fieldName.endsWith('_id') && 
              !['account_id', 'subhead_id', 'head_id', 'sub_id', 'acc_id'].includes(fieldName))) &&
            restOfLine.includes('@id') && 
            restOfLine.includes('autoincrement')) {
          continue;
        }
        
        // Convert field name to readable Excel column name
        const excelColumnName = fieldName
          .replace(/_/g, " ")
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .split(" ")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        
        fields[fieldName] = {
          excelColumn: excelColumnName,
          type: restOfLine.split(/\s+/)[0],
          optional: restOfLine.includes('?'),
        };
      }
    }
    
    if (Object.keys(fields).length > 0) {
      models[modelName] = fields;
    }
  }
  
  return models;
}

/**
 * Convert model name to Excel sheet name
 */
export function modelNameToSheetName(modelName) {
  return modelName
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

