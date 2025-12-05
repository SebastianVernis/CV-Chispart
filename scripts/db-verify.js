#!/usr/bin/env node

/**
 * Database Verification Script
 * Verifies database integrity and structure
 * 
 * This script:
 * 1. Checks database connection
 * 2. Verifies table structure
 * 3. Checks indexes
 * 4. Validates data integrity
 * 5. Reports any issues
 */

const { execSync } = require('child_process');
const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function execQuery(databaseName, query, description) {
  try {
    const output = execSync(
      `wrangler d1 execute ${databaseName} --command="${query}" --remote`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  log(`\n${colors.bright}==================================${colors.reset}`);
  log(`${colors.bright}  Database Verification           ${colors.reset}`);
  log(`${colors.bright}==================================${colors.reset}\n`);

  // Read database name from wrangler.toml
  const wranglerConfig = fs.readFileSync('./wrangler.toml', 'utf-8');
  const dbNameMatch = wranglerConfig.match(/database_name\s*=\s*"([^"]+)"/);

  if (!dbNameMatch) {
    log(`${colors.red}✗ No se encontró database_name en wrangler.toml${colors.reset}`);
    process.exit(1);
  }

  const databaseName = dbNameMatch[1];
  log(`${colors.cyan}Base de datos: ${databaseName}${colors.reset}\n`);

  let issuesFound = 0;
  let checksPerformed = 0;

  // Check 1: Verify tables exist
  log(`${colors.cyan}1. Verificando tablas...${colors.reset}`);
  checksPerformed++;
  
  const tablesResult = execQuery(
    databaseName,
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    'Listando tablas'
  );

  if (tablesResult.success) {
    const requiredTables = ['users', 'cvs'];
    let allTablesExist = true;
    
    for (const table of requiredTables) {
      if (tablesResult.output.includes(table)) {
        log(`  ${colors.green}✓ Tabla '${table}' existe${colors.reset}`);
      } else {
        log(`  ${colors.red}✗ Tabla '${table}' no encontrada${colors.reset}`);
        allTablesExist = false;
        issuesFound++;
      }
    }
    
    if (allTablesExist) {
      log(`  ${colors.green}✓ Todas las tablas requeridas existen${colors.reset}`);
    }
  } else {
    log(`  ${colors.red}✗ Error al verificar tablas${colors.reset}`);
    issuesFound++;
  }

  // Check 2: Verify users table structure
  log(`\n${colors.cyan}2. Verificando estructura de tabla 'users'...${colors.reset}`);
  checksPerformed++;
  
  const usersStructure = execQuery(
    databaseName,
    "PRAGMA table_info(users)",
    'Estructura de users'
  );

  if (usersStructure.success) {
    const requiredColumns = [
      'id', 'username', 'password_hash', 'email', 
      'email_verified', 'email_verification_token', 'created_at'
    ];
    
    let allColumnsExist = true;
    for (const column of requiredColumns) {
      if (usersStructure.output.includes(column)) {
        log(`  ${colors.green}✓ Columna '${column}' existe${colors.reset}`);
      } else {
        log(`  ${colors.red}✗ Columna '${column}' no encontrada${colors.reset}`);
        allColumnsExist = false;
        issuesFound++;
      }
    }
  } else {
    log(`  ${colors.red}✗ Error al verificar estructura de users${colors.reset}`);
    issuesFound++;
  }

  // Check 3: Verify cvs table structure
  log(`\n${colors.cyan}3. Verificando estructura de tabla 'cvs'...${colors.reset}`);
  checksPerformed++;
  
  const cvsStructure = execQuery(
    databaseName,
    "PRAGMA table_info(cvs)",
    'Estructura de cvs'
  );

  if (cvsStructure.success) {
    const requiredColumns = [
      'id', 'user_id', 'name', 'data', 'profile_image',
      'slug', 'is_public', 'created_at', 'updated_at'
    ];
    
    let allColumnsExist = true;
    for (const column of requiredColumns) {
      if (cvsStructure.output.includes(column)) {
        log(`  ${colors.green}✓ Columna '${column}' existe${colors.reset}`);
      } else {
        log(`  ${colors.red}✗ Columna '${column}' no encontrada${colors.reset}`);
        allColumnsExist = false;
        issuesFound++;
      }
    }
  } else {
    log(`  ${colors.red}✗ Error al verificar estructura de cvs${colors.reset}`);
    issuesFound++;
  }

  // Check 4: Verify indexes
  log(`\n${colors.cyan}4. Verificando índices...${colors.reset}`);
  checksPerformed++;
  
  const indexesResult = execQuery(
    databaseName,
    "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'",
    'Listando índices'
  );

  if (indexesResult.success) {
    const requiredIndexes = [
      'idx_cvs_user_id',
      'idx_cvs_updated_at',
      'idx_cvs_slug',
      'idx_cvs_public',
      'idx_users_username'
    ];
    
    for (const index of requiredIndexes) {
      if (indexesResult.output.includes(index)) {
        log(`  ${colors.green}✓ Índice '${index}' existe${colors.reset}`);
      } else {
        log(`  ${colors.yellow}⚠ Índice '${index}' no encontrado${colors.reset}`);
      }
    }
  } else {
    log(`  ${colors.yellow}⚠ No se pudieron verificar índices${colors.reset}`);
  }

  // Check 5: Count users
  log(`\n${colors.cyan}5. Verificando usuarios...${colors.reset}`);
  checksPerformed++;
  
  const usersCount = execQuery(
    databaseName,
    "SELECT COUNT(*) as count FROM users",
    'Contando usuarios'
  );

  if (usersCount.success) {
    log(`  ${colors.green}✓ Usuarios en la base de datos${colors.reset}`);
    
    // Check for default user
    const defaultUser = execQuery(
      databaseName,
      "SELECT username FROM users WHERE username='rafael'",
      'Verificando usuario por defecto'
    );
    
    if (defaultUser.success && defaultUser.output.includes('rafael')) {
      log(`  ${colors.green}✓ Usuario por defecto 'rafael' existe${colors.reset}`);
    } else {
      log(`  ${colors.yellow}⚠ Usuario por defecto 'rafael' no encontrado${colors.reset}`);
    }
  } else {
    log(`  ${colors.red}✗ Error al contar usuarios${colors.reset}`);
    issuesFound++;
  }

  // Check 6: Count CVs
  log(`\n${colors.cyan}6. Verificando CVs...${colors.reset}`);
  checksPerformed++;
  
  const cvsCount = execQuery(
    databaseName,
    "SELECT COUNT(*) as count FROM cvs",
    'Contando CVs'
  );

  if (cvsCount.success) {
    log(`  ${colors.green}✓ CVs en la base de datos${colors.reset}`);
  } else {
    log(`  ${colors.red}✗ Error al contar CVs${colors.reset}`);
    issuesFound++;
  }

  // Check 7: Verify foreign key relationships
  log(`\n${colors.cyan}7. Verificando relaciones de claves foráneas...${colors.reset}`);
  checksPerformed++;
  
  const orphanedCVs = execQuery(
    databaseName,
    "SELECT COUNT(*) FROM cvs WHERE user_id NOT IN (SELECT id FROM users)",
    'Buscando CVs huérfanos'
  );

  if (orphanedCVs.success) {
    if (orphanedCVs.output.includes('0')) {
      log(`  ${colors.green}✓ No hay CVs huérfanos${colors.reset}`);
    } else {
      log(`  ${colors.yellow}⚠ Se encontraron CVs sin usuario asociado${colors.reset}`);
      issuesFound++;
    }
  } else {
    log(`  ${colors.yellow}⚠ No se pudo verificar integridad referencial${colors.reset}`);
  }

  // Check 8: Verify slug uniqueness
  log(`\n${colors.cyan}8. Verificando unicidad de slugs...${colors.reset}`);
  checksPerformed++;
  
  const duplicateSlugs = execQuery(
    databaseName,
    "SELECT slug, COUNT(*) as count FROM cvs GROUP BY slug HAVING count > 1",
    'Buscando slugs duplicados'
  );

  if (duplicateSlugs.success) {
    if (duplicateSlugs.output.trim() === '' || !duplicateSlugs.output.includes('|')) {
      log(`  ${colors.green}✓ Todos los slugs son únicos${colors.reset}`);
    } else {
      log(`  ${colors.red}✗ Se encontraron slugs duplicados${colors.reset}`);
      issuesFound++;
    }
  } else {
    log(`  ${colors.yellow}⚠ No se pudo verificar unicidad de slugs${colors.reset}`);
  }

  // Summary
  log(`\n${colors.bright}==================================${colors.reset}`);
  log(`${colors.bright}  Resumen de Verificación         ${colors.reset}`);
  log(`${colors.bright}==================================${colors.reset}\n`);

  log(`Verificaciones realizadas: ${checksPerformed}`);
  
  if (issuesFound === 0) {
    log(`${colors.green}✓ No se encontraron problemas${colors.reset}`);
    log(`${colors.green}✓ La base de datos está en buen estado${colors.reset}\n`);
    process.exit(0);
  } else {
    log(`${colors.yellow}⚠ Se encontraron ${issuesFound} problema(s)${colors.reset}`);
    log(`${colors.yellow}Revisa los detalles arriba y ejecuta las correcciones necesarias${colors.reset}\n`);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  log(`\n${colors.red}Error fatal: ${error.message}${colors.reset}`);
  process.exit(1);
});
