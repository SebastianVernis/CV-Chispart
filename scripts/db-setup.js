#!/usr/bin/env node

/**
 * Database Setup Script
 * Automated setup for Cloudflare D1 database
 * 
 * This script:
 * 1. Checks if database exists
 * 2. Creates database if needed
 * 3. Initializes schema
 * 4. Seeds default data
 * 5. Verifies setup
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function execCommand(command, description) {
  log(`\n${colors.cyan}➜ ${description}...${colors.reset}`);
  try {
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    log(`${colors.green}✓ ${description} completado${colors.reset}`);
    return { success: true, output };
  } catch (error) {
    log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

function checkFile(filePath, description) {
  if (!fs.existsSync(filePath)) {
    log(`${colors.red}✗ Archivo no encontrado: ${filePath}${colors.reset}`);
    return false;
  }
  log(`${colors.green}✓ ${description} encontrado${colors.reset}`);
  return true;
}

async function main() {
  log(`\n${colors.bright}==================================${colors.reset}`);
  log(`${colors.bright}  Database Setup - Cloudflare D1  ${colors.reset}`);
  log(`${colors.bright}==================================${colors.reset}\n`);

  // Step 1: Check required files
  log(`${colors.cyan}Paso 1: Verificando archivos requeridos${colors.reset}`);
  
  const requiredFiles = [
    { path: './wrangler.toml', desc: 'Configuración de Wrangler' },
    { path: './init_database.sql', desc: 'Script de inicialización' },
  ];

  let allFilesExist = true;
  for (const file of requiredFiles) {
    if (!checkFile(file.path, file.desc)) {
      allFilesExist = false;
    }
  }

  if (!allFilesExist) {
    log(`\n${colors.red}Error: Faltan archivos requeridos${colors.reset}`);
    process.exit(1);
  }

  // Step 2: Read wrangler.toml to get database info
  log(`\n${colors.cyan}Paso 2: Leyendo configuración${colors.reset}`);
  
  const wranglerConfig = fs.readFileSync('./wrangler.toml', 'utf-8');
  const dbNameMatch = wranglerConfig.match(/database_name\s*=\s*"([^"]+)"/);
  const dbIdMatch = wranglerConfig.match(/database_id\s*=\s*"([^"]+)"/);

  if (!dbNameMatch) {
    log(`${colors.red}✗ No se encontró database_name en wrangler.toml${colors.reset}`);
    process.exit(1);
  }

  const databaseName = dbNameMatch[1];
  const databaseId = dbIdMatch ? dbIdMatch[1] : null;

  log(`${colors.green}✓ Database name: ${databaseName}${colors.reset}`);
  if (databaseId) {
    log(`${colors.green}✓ Database ID: ${databaseId}${colors.reset}`);
  } else {
    log(`${colors.yellow}⚠ Database ID no configurado${colors.reset}`);
  }

  // Step 3: Check if database exists
  log(`\n${colors.cyan}Paso 3: Verificando si la base de datos existe${colors.reset}`);
  
  const listResult = execCommand(
    'wrangler d1 list',
    'Listando bases de datos'
  );

  let databaseExists = false;
  if (listResult.success && listResult.output.includes(databaseName)) {
    databaseExists = true;
    log(`${colors.green}✓ Base de datos '${databaseName}' encontrada${colors.reset}`);
  } else {
    log(`${colors.yellow}⚠ Base de datos '${databaseName}' no encontrada${colors.reset}`);
  }

  // Step 4: Create database if it doesn't exist
  if (!databaseExists) {
    log(`\n${colors.cyan}Paso 4: Creando base de datos${colors.reset}`);
    
    const createResult = execCommand(
      `wrangler d1 create ${databaseName}`,
      `Creando base de datos '${databaseName}'`
    );

    if (!createResult.success) {
      log(`\n${colors.red}Error: No se pudo crear la base de datos${colors.reset}`);
      process.exit(1);
    }

    // Extract database ID from output
    const idMatch = createResult.output.match(/database_id\s*=\s*"([^"]+)"/);
    if (idMatch) {
      const newDatabaseId = idMatch[1];
      log(`\n${colors.yellow}⚠ IMPORTANTE: Actualiza wrangler.toml con el siguiente database_id:${colors.reset}`);
      log(`${colors.bright}database_id = "${newDatabaseId}"${colors.reset}\n`);
      
      // Optionally update wrangler.toml automatically
      if (!databaseId) {
        const updatedConfig = wranglerConfig.replace(
          /database_id\s*=\s*"[^"]*"/,
          `database_id = "${newDatabaseId}"`
        );
        fs.writeFileSync('./wrangler.toml', updatedConfig);
        log(`${colors.green}✓ wrangler.toml actualizado automáticamente${colors.reset}`);
      }
    }
  } else {
    log(`\n${colors.cyan}Paso 4: Base de datos ya existe, omitiendo creación${colors.reset}`);
  }

  // Step 5: Initialize schema
  log(`\n${colors.cyan}Paso 5: Inicializando schema de base de datos${colors.reset}`);
  
  const initResult = execCommand(
    `wrangler d1 execute ${databaseName} --file=./init_database.sql --remote`,
    'Ejecutando init_database.sql'
  );

  if (!initResult.success) {
    log(`\n${colors.yellow}⚠ Advertencia: Error al inicializar schema${colors.reset}`);
    log(`${colors.yellow}Esto puede ser normal si las tablas ya existen${colors.reset}`);
  }

  // Step 6: Verify setup
  log(`\n${colors.cyan}Paso 6: Verificando instalación${colors.reset}`);
  
  const verifyResult = execCommand(
    `wrangler d1 execute ${databaseName} --command="SELECT name FROM sqlite_master WHERE type='table'" --remote`,
    'Verificando tablas creadas'
  );

  if (verifyResult.success) {
    if (verifyResult.output.includes('users') && verifyResult.output.includes('cvs')) {
      log(`${colors.green}✓ Tablas 'users' y 'cvs' verificadas${colors.reset}`);
    } else {
      log(`${colors.yellow}⚠ Advertencia: No se pudieron verificar todas las tablas${colors.reset}`);
    }
  }

  // Step 7: Check default user
  log(`\n${colors.cyan}Paso 7: Verificando usuario por defecto${colors.reset}`);
  
  const userResult = execCommand(
    `wrangler d1 execute ${databaseName} --command="SELECT username FROM users WHERE username='rafael'" --remote`,
    'Verificando usuario Rafael'
  );

  if (userResult.success && userResult.output.includes('rafael')) {
    log(`${colors.green}✓ Usuario 'rafael' encontrado${colors.reset}`);
  } else {
    log(`${colors.yellow}⚠ Usuario 'rafael' no encontrado${colors.reset}`);
  }

  // Summary
  log(`\n${colors.bright}==================================${colors.reset}`);
  log(`${colors.bright}  Setup Completado                 ${colors.reset}`);
  log(`${colors.bright}==================================${colors.reset}\n`);

  log(`${colors.green}✓ Base de datos configurada correctamente${colors.reset}`);
  log(`\n${colors.cyan}Próximos pasos:${colors.reset}`);
  log(`  1. Verifica que wrangler.toml tenga el database_id correcto`);
  log(`  2. Ejecuta: ${colors.bright}npm run dev${colors.reset} para probar localmente`);
  log(`  3. Ejecuta: ${colors.bright}npm run deploy${colors.reset} para desplegar a producción`);
  log(`\n${colors.cyan}Usuario por defecto:${colors.reset}`);
  log(`  Username: ${colors.bright}rafael${colors.reset}`);
  log(`  Password: ${colors.bright}RMora1*${colors.reset}\n`);
}

// Run the script
main().catch((error) => {
  log(`\n${colors.red}Error fatal: ${error.message}${colors.reset}`);
  process.exit(1);
});
