import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const crearTablas = async () => {
  let connection;
  
  try {
    console.log('🔄 Conectando a MySQL...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT
    });

    // Crear base de datos si no existe
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log('✅ Base de datos verificada');

    // Usar la base de datos
    await connection.query(`USE ${process.env.DB_NAME}`);

    // Crear tabla inscripciones
    await connection.query(`
      CREATE TABLE IF NOT EXISTS inscripciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_usuario_mongo VARCHAR(255) NOT NULL,
        id_evento_mongo VARCHAR(255) NOT NULL,
        fecha_inscripcion DATETIME DEFAULT CURRENT_TIMESTAMP,
        estado ENUM('pendiente', 'confirmada', 'cancelada') DEFAULT 'pendiente',
        notas TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_usuario (id_usuario_mongo),
        INDEX idx_evento (id_evento_mongo),
        INDEX idx_estado (estado),
        UNIQUE KEY unique_user_event (id_usuario_mongo, id_evento_mongo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla inscripciones creada/verificada');

    // Crear tabla pagos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pagos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_inscripcion INT NOT NULL,
        monto DECIMAL(10, 2) NOT NULL,
        metodo_pago ENUM('tarjeta', 'efectivo', 'transferencia', 'pse', 'daviplata', 'nequi') NOT NULL,
        estado ENUM('pendiente', 'completado', 'fallido', 'reembolsado') DEFAULT 'pendiente',
        fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
        referencia_pago VARCHAR(255),
        descripcion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (id_inscripcion) REFERENCES inscripciones(id) ON DELETE CASCADE,
        INDEX idx_inscripcion (id_inscripcion),
        INDEX idx_estado (estado),
        INDEX idx_metodo (metodo_pago)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla pagos creada/verificada');

    console.log('\n✅ Todas las tablas fueron creadas/verificadas exitosamente\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

crearTablas()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));