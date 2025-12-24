// Script de inicialización de base de datos para sistema hidropónico
// PostgreSQL + Node.js + ES Modules
// Ejecutar con: node setup_database.js

import pg from 'pg';
const { Client } = pg;

// Configuración de conexión a PostgreSQL
const dbConfig = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'matias123', // Cambiar por tu contraseña
  database: 'postgres' // Conectar primero a la BD por defecto
};

async function inicializarBaseDatos() {
  let client = new Client(dbConfig);
  
  try {
    console.log('Conectando a PostgreSQL...');
    await client.connect();
    
    // Crear base de datos si no existe
    console.log('Creando base de datos...');
    try {
      await client.query('CREATE DATABASE hidroponico_db');
      console.log('Base de datos hidroponico_db creada');
    } catch (error) {
      if (error.code === '42P04') {
        console.log('Base de datos ya existe, continuando...');
      } else {
        throw error;
      }
    }
    
    await client.end();
    
    // Conectar a la nueva base de datos
    client = new Client({...dbConfig, database: 'hidroponico_db'});
    await client.connect();
    
    // Crear tabla de lecturas del sistema
    console.log('Creando tabla lecturas_sistema...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS lecturas_sistema (
        id SERIAL PRIMARY KEY,
        temperatura DECIMAL(5,2) NOT NULL,
        humedad DECIMAL(5,2) NOT NULL,
        ph_agua DECIMAL(4,2),
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_fecha ON lecturas_sistema(fecha_registro)
    `);
    
    // Agregar comentarios a la tabla
    await client.query(`
      COMMENT ON TABLE lecturas_sistema IS 'Registro de condiciones ambientales del sistema'
    `);
    await client.query(`
      COMMENT ON COLUMN lecturas_sistema.temperatura IS 'Temperatura en grados Celsius'
    `);
    await client.query(`
      COMMENT ON COLUMN lecturas_sistema.humedad IS 'Humedad relativa en porcentaje'
    `);
    await client.query(`
      COMMENT ON COLUMN lecturas_sistema.ph_agua IS 'Nivel de pH del agua'
    `);
    
    // Crear tabla de nutrientes
    console.log('Creando tabla nutrientes...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS nutrientes (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL,
        unidad_medida VARCHAR(20) NOT NULL,
        rango_optimo_min DECIMAL(8,2),
        rango_optimo_max DECIMAL(8,2),
        descripcion TEXT
      )
    `);
    
    await client.query(`
      COMMENT ON TABLE nutrientes IS 'Catálogo de nutrientes utilizados'
    `);
    await client.query(`
      COMMENT ON COLUMN nutrientes.unidad_medida IS 'ppm, mg/L, etc.'
    `);
    
    // Crear tabla de mediciones de nutrientes
    console.log('Creando tabla mediciones_nutrientes...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS mediciones_nutrientes (
        id SERIAL PRIMARY KEY,
        lectura_id INTEGER NOT NULL,
        nutriente_id INTEGER NOT NULL,
        concentracion DECIMAL(8,2) NOT NULL,
        fecha_medicion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lectura_id) REFERENCES lecturas_sistema(id) ON DELETE CASCADE,
        FOREIGN KEY (nutriente_id) REFERENCES nutrientes(id)
      )
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_fecha_medicion ON mediciones_nutrientes(fecha_medicion)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_nutriente ON mediciones_nutrientes(nutriente_id)
    `);
    
    await client.query(`
      COMMENT ON TABLE mediciones_nutrientes IS 'Registro de concentraciones de nutrientes'
    `);
    
    // Insertar nutrientes básicos
    console.log('Insertando nutrientes...');
    const nutrientesCheck = await client.query('SELECT COUNT(*) as count FROM nutrientes');
    
    if (parseInt(nutrientesCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO nutrientes (nombre, unidad_medida, rango_optimo_min, rango_optimo_max, descripcion) 
        VALUES 
          ('Nitrógeno (N)', 'ppm', 150.00, 250.00, 'Esencial para crecimiento vegetativo y producción de clorofila'),
          ('Fósforo (P)', 'ppm', 30.00, 50.00, 'Fundamental para desarrollo de raíces y floración')
      `);
      console.log('Nutrientes insertados correctamente');
    } else {
      console.log('Nutrientes ya existen, omitiendo inserción');
    }
    
    // Insertar datos de ejemplo
    console.log('Insertando datos de ejemplo...');
    const datosEjemplo = [
      { temperatura: 22.5, humedad: 65.0, ph_agua: 6.2, fecha: '2024-12-23 08:00:00' },
      { temperatura: 23.0, humedad: 63.5, ph_agua: 6.3, fecha: '2024-12-23 12:00:00' },
      { temperatura: 24.2, humedad: 68.0, ph_agua: 6.1, fecha: '2024-12-23 16:00:00' },
      { temperatura: 21.8, humedad: 70.5, ph_agua: 6.4, fecha: '2024-12-23 20:00:00' },
      { temperatura: 22.0, humedad: 66.0, ph_agua: 6.2, fecha: '2024-12-24 08:00:00' }
    ];
    
    for (const dato of datosEjemplo) {
      const lecturaResult = await client.query(
        'INSERT INTO lecturas_sistema (temperatura, humedad, ph_agua, fecha_registro) VALUES ($1, $2, $3, $4) RETURNING id',
        [dato.temperatura, dato.humedad, dato.ph_agua, dato.fecha]
      );
      
      const lecturaId = lecturaResult.rows[0].id;
      
      // Insertar mediciones de nutrientes para esta lectura
      const nitrogeno = 200.00 + Math.random() * 20 - 10;
      const fosforo = 40.00 + Math.random() * 10 - 5;
      
      await client.query(
        'INSERT INTO mediciones_nutrientes (lectura_id, nutriente_id, concentracion, fecha_medicion) VALUES ($1, 1, $2, $3), ($4, 2, $5, $6)',
        [lecturaId, nitrogeno.toFixed(2), dato.fecha, lecturaId, fosforo.toFixed(2), dato.fecha]
      );
    }
    
    // Crear vista para consultas completas
    console.log('Creando vista lecturas_completas...');
    await client.query('DROP VIEW IF EXISTS vista_lecturas_completas');
    await client.query(`
      CREATE VIEW vista_lecturas_completas AS
      SELECT 
        ls.id,
        ls.temperatura,
        ls.humedad,
        ls.ph_agua,
        ls.fecha_registro,
        STRING_AGG(n.nombre || ': ' || mn.concentracion || ' ' || n.unidad_medida, ', ') as nutrientes
      FROM lecturas_sistema ls
      LEFT JOIN mediciones_nutrientes mn ON ls.id = mn.lectura_id
      LEFT JOIN nutrientes n ON mn.nutriente_id = n.id
      GROUP BY ls.id, ls.temperatura, ls.humedad, ls.ph_agua, ls.fecha_registro
      ORDER BY ls.fecha_registro DESC
    `);
    
    console.log('\n✅ Base de datos creada exitosamente!');
    console.log('Base de datos: hidroponico_db');
    console.log('Tablas creadas: lecturas_sistema, nutrientes, mediciones_nutrientes');
    console.log('Vista creada: vista_lecturas_completas');
    
  } catch (error) {
    console.error('❌ Error al crear la base de datos:', error.message);
    throw error;
  } finally {
    if (client) {
      await client.end();
      console.log('\nConexión cerrada');
    }
  }
}

// Funciones de ejemplo para usar en tu API
async function obtenerUltimasLecturas(limite = 10) {
  const client = new Client({...dbConfig, database: 'hidroponico_db'});
  await client.connect();
  try {
    const result = await client.query(
      'SELECT * FROM vista_lecturas_completas LIMIT $1',
      [limite]
    );
    return result.rows;
  } finally {
    await client.end();
  }
}

async function insertarLectura(temperatura, humedad, phAgua, nutrientes) {
  const client = new Client({...dbConfig, database: 'hidroponico_db'});
  await client.connect();
  try {
    await client.query('BEGIN');
    
    // Insertar lectura principal
    const result = await client.query(
      'INSERT INTO lecturas_sistema (temperatura, humedad, ph_agua) VALUES ($1, $2, $3) RETURNING id',
      [temperatura, humedad, phAgua]
    );
    
    const lecturaId = result.rows[0].id;
    
    // Insertar mediciones de nutrientes
    for (const nutriente of nutrientes) {
      await client.query(
        'INSERT INTO mediciones_nutrientes (lectura_id, nutriente_id, concentracion) VALUES ($1, $2, $3)',
        [lecturaId, nutriente.id, nutriente.concentracion]
      );
    }
    
    await client.query('COMMIT');
    return lecturaId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

async function obtenerLecturasPorRango(fechaInicio, fechaFin) {
  const client = new Client({...dbConfig, database: 'hidroponico_db'});
  await client.connect();
  try {
    const result = await client.query(
      'SELECT * FROM vista_lecturas_completas WHERE fecha_registro BETWEEN $1 AND $2',
      [fechaInicio, fechaFin]
    );
    return result.rows;
  } finally {
    await client.end();
  }
}

async function obtenerPromediosDiarios(dias = 7) {
  const client = new Client({...dbConfig, database: 'hidroponico_db'});
  await client.connect();
  try {
    const result = await client.query(`
      SELECT 
        DATE(fecha_registro) as fecha,
        AVG(temperatura)::DECIMAL(5,2) as temp_promedio,
        AVG(humedad)::DECIMAL(5,2) as humedad_promedio,
        AVG(ph_agua)::DECIMAL(4,2) as ph_promedio,
        COUNT(*) as num_lecturas
      FROM lecturas_sistema
      WHERE fecha_registro >= CURRENT_DATE - INTERVAL '${dias} days'
      GROUP BY DATE(fecha_registro)
      ORDER BY fecha DESC
    `);
    return result.rows;
  } finally {
    await client.end();
  }
}

// Función para verificar si el script se ejecuta directamente
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

// Ejecutar inicialización si se ejecuta directamente
if (isMainModule) {
  inicializarBaseDatos()
    .then(() => {
      console.log('\n📊 Probando consulta de ejemplo...');
      return obtenerUltimasLecturas(5);
    })
    .then(lecturas => {
      console.log('\nÚltimas 5 lecturas:');
      console.table(lecturas);
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

// Exportar funciones para usar en tu API
export {
  inicializarBaseDatos,
  obtenerUltimasLecturas,
  insertarLectura,
  obtenerLecturasPorRango,
  obtenerPromediosDiarios
};