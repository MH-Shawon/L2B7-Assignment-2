import { pool } from "../../db";
import type { IIssue } from "../../types";

const postIssueIntoDB = async (payload: {
  title: string;
  description: string;
  type: string;
  id: number;
}) => {
  const { title, description, type, id } = payload;
  const status = "open";
  const result = await pool.query(
    `
       INSERT INTO issues(reporter_id,title,type,status,description) VALUES($1,$2,$3,$4,$5) RETURNING *
        `,
    [id, title, type, status, description],
  );
  return result;
};
type Query = {
  sort?: string;
  type?: string;
  status?: string;
};
const getAllIssuesFromDB = async (query: Query) => {
  const issues = await pool.query(`
        SELECT * FROM issues
        `);

  const users = await pool.query(`
        SELECT * FROM users
        `);

  const reporterMap = users.rows.reduce((acc, u) => {
    acc[u.id] = {
      id: u.id,
      name: u.name,
      role: u.role,
    };

    return acc;
  }, {});

  const finalIssues = issues.rows.map((i) => ({
    id: i.id,
    title: i.title,
    description: i.description,
    type: i.type,
    status: i.status,
    reporter: reporterMap[i.reporter_id],
    created_at: i.created_at,
    updated_at: i.updated_at,
  }));
  let filteredIssues = finalIssues;
  if (query.type) {
    filteredIssues = filteredIssues.filter(
      (issue) => issue.type === query.type,
    );
  }

  if (query.status) {
    filteredIssues = filteredIssues.filter(
      (issue) => issue.status === query.status,
    );
  }

  filteredIssues.sort((a, b) => {
    if (query.sort === "oldest") {
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }

    // newest default
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return filteredIssues;
};

const getSingleIssueFromDB = async (id: string) => {
  const issueResult = await pool.query(
    `
    SELECT * FROM issues WHERE id=$1
    `,
    [id],
  );

  const issue = issueResult.rows[0];

  if (!issue) {
    return null;
  }

  const userResult = await pool.query(`
        SELECT * FROM users
        `);

  const reporterMap = userResult.rows.reduce((acc, u) => {
    acc[u.id] = {
      id: u.id,
      name: u.name,
      role: u.role,
    };

    return acc;
  }, {});

  const finalIssue = {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reporterMap[issue.reporter_id],
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  };

  return finalIssue;
};

const updateIssueInDB = async (
  payload: IIssue,
  id: string,
  loginUser: { role: string; userId: string },
) => {
  const { title, type, description } = payload;

  const getUserFromDB = await pool.query(
    `
  SELECT * FROM users WHERE id=$1
  `,
    [loginUser.userId],
  );

  const getIssueFromDB = await pool.query(
    `
  SELECT * FROM issues WHERE id=$1
  `,
    [id],
  );

  if (!getIssueFromDB) {
    throw new Error("Issue not found");
  }

  const role = getUserFromDB.rows[0].role;
  const issue = getIssueFromDB.rows[0];

  if (
    role !== "maintainer" &&
    !(
      role === "contributor" &&
      issue.reporter_id === Number(loginUser.userId) &&
      issue.status === "open"
    )
  ) {
    throw new Error("Forbidden access");
  }

  const result = await pool.query(
    `
    UPDATE issues
    SET
    title=COALESCE($1,title),
    type=COALESCE($2,type),
    description=COALESCE($3,description),
    updated_at = NOW()
    WHERE id=$4 RETURNING *
    `,
    [title, type, description, id],
  );

  if (role === "maintainer" && payload.status) {
    await pool.query(
      `
      UPDATE issues
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [payload.status, id],
    );
  }

  return result;
};

const deleteIssueFromDB = async (id: string) => {
  const result = await pool.query(
    `
    DELETE FROM issues WHERE id=$1
    `,
    [id],
  );
  return result;
};

export const issueService = {
  postIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  deleteIssueFromDB,
  updateIssueInDB,
};
