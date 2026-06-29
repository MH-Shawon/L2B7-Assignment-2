import { Pool } from "pg";
import config from "../config";
export const pool = new Pool({
  connectionString: config.connectionString,
});
export const initDB = async () => {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS users(
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role VARCHAR(20) DEFAULT 'contributor',

            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
            )
            `);

    await pool.query(`
              CREATE TABLE IF NOT EXISTS issues(
              id SERIAL PRIMARY KEY,
              reporter_id INT REFERENCES users(id),

              type TEXT NOT NULL,
              description TEXT NOT NULL,
              title VARCHAR(150) NOT NULL,
              
              status TEXT DEFAULT 'open',
              created_at TIMESTAMP DEFAULT NOW(),
              updated_at TIMESTAMP DEFAULT NOW()
              )
              `);

    console.log("Database connected successfully");
  } catch (error) {
    console.log(error);
  }
};