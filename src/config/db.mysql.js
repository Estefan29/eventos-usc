import mysql from "mysql2/promise";

let pool;

const conectarMySQL = async () => {
  try {
    if (!pool) {
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // Verificar conexión
      await pool.query('SELECT 1');
      console.log("✅ Pool de conexiones MySQL creado correctamente");
    }
    
    return pool;
  } catch (error) {
    console.error("❌ Error al conectar a MySQL:", error.message);
    throw error;
  }
};

export const cerrarPool = async () => {
  if (pool) {
    await pool.end();
    console.log("✅ Pool de MySQL cerrado");
  }
};

export default conectarMySQL;
