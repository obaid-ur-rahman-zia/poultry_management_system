// import mysql from "mysql2/promise";

// const pool = mysql.createPool({
//   host: process.env.DATABASE_HOST,
//   user: process.env.DATABASE_USER,
//   password: process.env.DATABASE_PASSWORD,
//   database: process.env.DATABASE_NAME,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

// export async function sql(query, params = []) {
//   const [rows] = await pool.execute(query, params);
//   return rows;
// }

// export async function withTransaction(fn) {
//   const conn = await pool.getConnection();
//   try {
//     await conn.beginTransaction();
//     const result = await fn(conn);
//     await conn.commit();
//     return result;
//   } catch (err) {
//     await conn.rollback();
//     throw err;
//   } finally {
//     conn.release();
//   }
// }
