// seed.js - Script para poblar la base de datos hidropónica
import { Sequelize, DataTypes } from 'sequelize';

// Configuración de conexión a PostgreSQL
const sequelize = new Sequelize('hidroponico_db', 'postgres', 'matias123', {
  host: 'localhost',
  port: 5432,
  dialect: 'postgres',
  logging: false, // Cambiar a console.log para ver las queries SQL
});

// Modelo: Lecturas del Sistema
const LecturaSistema = sequelize.define('lectura_sistema', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  temperatura: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    comment: 'Temperatura en grados Celsius',
  },
  humedad: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    comment: 'Humedad relativa en porcentaje',
  },
  ph_agua: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    comment: 'Nivel de pH del agua',
  },
  fecha_registro: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'lecturas_sistema',
  timestamps: false,
  indexes: [
    { fields: ['fecha_registro'] }
  ]
});

// Modelo: Nutrientes
const Nutriente = sequelize.define('nutriente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  unidad_medida: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'ppm, mg/L, etc.',
  },
  rango_optimo_min: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
  },
  rango_optimo_max: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'nutrientes',
  timestamps: false,
});

// Modelo: Mediciones de Nutrientes
const MedicionNutriente = sequelize.define('medicion_nutriente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  lectura_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'lecturas_sistema',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  nutriente_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'nutrientes',
      key: 'id',
    },
  },
  concentracion: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
  },
  fecha_medicion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'mediciones_nutrientes',
  timestamps: false,
  indexes: [
    { fields: ['fecha_medicion'] },
    { fields: ['nutriente_id'] }
  ]
});

// Definir relaciones
LecturaSistema.hasMany(MedicionNutriente, {
  foreignKey: 'lectura_id',
  as: 'mediciones',
});

MedicionNutriente.belongsTo(LecturaSistema, {
  foreignKey: 'lectura_id',
});

MedicionNutriente.belongsTo(Nutriente, {
  foreignKey: 'nutriente_id',
  as: 'nutriente',
});

Nutriente.hasMany(MedicionNutriente, {
  foreignKey: 'nutriente_id',
});

// Función principal de seed
async function seed() {
  try {
    console.log('Conectando a PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida correctamente.');

    // Eliminar y recrear tablas
    console.log('Eliminando y recreando tablas...');
    await sequelize.sync({ force: true });
    console.log('✅ Tablas eliminadas y recreadas.');

    // Crear nutrientes fijos
    console.log('\nInsertando nutrientes...');
    const nutrientes = await Nutriente.bulkCreate([
      {
        nombre: 'Nitrógeno (N)',
        unidad_medida: 'ppm',
        rango_optimo_min: 150.00,
        rango_optimo_max: 250.00,
        descripcion: 'Esencial para crecimiento vegetativo y producción de clorofila',
      },
      {
        nombre: 'Fósforo (P)',
        unidad_medida: 'ppm',
        rango_optimo_min: 30.00,
        rango_optimo_max: 50.00,
        descripcion: 'Fundamental para desarrollo de raíces y floración',
      },
    ]);
    console.log(`✅ ${nutrientes.length} nutrientes creados.`);

    // Crear lecturas de ejemplo
    console.log('\nInsertando lecturas del sistema...');
    const lecturasData = [
      {
        temperatura: 22.5,
        humedad: 65.0,
        ph_agua: 6.2,
        fecha_registro: new Date('2024-12-23 08:00:00'),
      },
      {
        temperatura: 23.0,
        humedad: 63.5,
        ph_agua: 6.3,
        fecha_registro: new Date('2024-12-23 12:00:00'),
      },
      {
        temperatura: 24.2,
        humedad: 68.0,
        ph_agua: 6.1,
        fecha_registro: new Date('2024-12-23 16:00:00'),
      },
      {
        temperatura: 21.8,
        humedad: 70.5,
        ph_agua: 6.4,
        fecha_registro: new Date('2024-12-23 20:00:00'),
      },
      {
        temperatura: 22.0,
        humedad: 66.0,
        ph_agua: 6.2,
        fecha_registro: new Date('2024-12-24 08:00:00'),
      },
    ];

    const lecturas = await LecturaSistema.bulkCreate(lecturasData);
    console.log(`✅ ${lecturas.length} lecturas creadas.`);

    // Crear mediciones de nutrientes para cada lectura
    console.log('\nInsertando mediciones de nutrientes...');
    const mediciones = [];

    for (let i = 0; i < lecturas.length; i++) {
      const lectura = lecturas[i];
      
      // Nitrógeno (ID 1)
      mediciones.push({
        lectura_id: lectura.id,
        nutriente_id: 1,
        concentracion: (200.0 + Math.random() * 20 - 10).toFixed(2),
        fecha_medicion: lecturasData[i].fecha_registro,
      });

      // Fósforo (ID 2)
      mediciones.push({
        lectura_id: lectura.id,
        nutriente_id: 2,
        concentracion: (40.0 + Math.random() * 10 - 5).toFixed(2),
        fecha_medicion: lecturasData[i].fecha_registro,
      });
    }

    await MedicionNutriente.bulkCreate(mediciones);
    console.log(`✅ ${mediciones.length} mediciones creadas.`);

    // Crear vista para consultas completas
    console.log('\nCreando vista lecturas_completas...');
    await sequelize.query('DROP VIEW IF EXISTS vista_lecturas_completas');
    await sequelize.query(`
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
    console.log('✅ Vista creada correctamente.');

    // Mostrar resumen
    console.log('\n📊 RESUMEN DE DATOS CREADOS:');
    console.log('================================');
    console.log(`Nutrientes: ${nutrientes.length}`);
    console.log(`Lecturas: ${lecturas.length}`);
    console.log(`Mediciones: ${mediciones.length}`);
    console.log('================================\n');

    // Consulta de prueba
    console.log('Probando consulta de últimas lecturas...\n');
    const [resultados] = await sequelize.query(
      'SELECT * FROM vista_lecturas_completas LIMIT 5'
    );
    console.table(resultados);

    console.log('\n✅ ¡Base de datos poblada exitosamente!');
  } catch (error) {
    console.error('❌ Error al poblar la base de datos:', error);
  } finally {
    await sequelize.close();
    console.log('\nConexión cerrada.');
    process.exit();
  }
}

// Ejecutar seed
seed();