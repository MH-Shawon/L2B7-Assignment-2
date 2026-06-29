import bcrypt from "bcryptjs";
import type { IUser } from "./user.interface";
import { pool } from "../../db";

const createUserIntoDB = async (payload: IUser) => {
  const { name, email, password, role } = payload;
  const encryptedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
        INSERT INTO users(name,email,password,role) values($1,$2,$3, COALESCE($4, 'contributor')) RETURNING *
        `,
    [name, email, encryptedPassword, role],
  );
  delete result.rows[0].password;
  return result;
};

export const userService = {
  createUserIntoDB,
};
