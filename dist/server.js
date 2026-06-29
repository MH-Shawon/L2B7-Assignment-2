

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  port: process.env.PORT,
  connectionString: process.env.CONNECTION_STRING,
  JWT_Secret: process.env.JWT_SECRET
};
var config_default = config;

// src/app.ts
import express from "express";

// src/utility/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    errors: data.errors
  });
};
var sendResponse_default = sendResponse;

// src/modules/user/user.route.ts
import { Router } from "express";

// src/modules/user/user.service.ts
import bcrypt from "bcryptjs";

// src/db/index.ts
import { Pool } from "pg";
import dns from "dns/promises";
var realPool = null;
async function createPool() {
  if (realPool) return realPool;
  const cs = String(config_default.connectionString || "");
  const baseCfg = {
    connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT) || 5e3
  };
  let sslOpt = void 0;
  if (process.env.DB_SSL === "true" || /sslmode=require/i.test(cs)) {
    try {
      const url = new URL(cs);
      sslOpt = { rejectUnauthorized: false, servername: url.hostname };
    } catch (e) {
      sslOpt = { rejectUnauthorized: false };
    }
  }
  try {
    const url = new URL(cs);
    const host = url.hostname;
    const port = Number(url.port) || 5432;
    const user = url.username || void 0;
    const password = url.password || void 0;
    const database = url.pathname ? url.pathname.replace(/^\//, "") : void 0;
    let hostaddr;
    try {
      const lookup = await dns.lookup(host, { family: 4 });
      hostaddr = lookup.address;
    } catch (e) {
      hostaddr = void 0;
    }
    const cfg = {
      ...baseCfg,
      host: hostaddr || host,
      port,
      user,
      password,
      database
    };
    if (sslOpt) cfg.ssl = sslOpt;
    realPool = new Pool(cfg);
    return realPool;
  } catch (e) {
    realPool = new Pool({
      ...baseCfg,
      connectionString: cs,
      ...sslOpt ? { ssl: sslOpt } : {}
    });
    return realPool;
  }
}
async function getPool() {
  return await createPool();
}
var pool = {
  query: async (...args) => (await getPool()).query(...args),
  connect: async (...args) => (await getPool()).connect(...args),
  end: async (...args) => (await getPool()).end(...args)
};
var initDB = async () => {
  try {
    const p = await getPool();
    await p.query(`
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
    await p.query(`
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

// src/modules/user/user.service.ts
var createUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const encryptedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
        INSERT INTO users(name,email,password,role) values($1,$2,$3, COALESCE($4, 'contributor')) RETURNING *
        `,
    [name, email, encryptedPassword, role]
  );
  delete result.rows[0].password;
  return result;
};
var userService = {
  createUserIntoDB
};

// src/modules/user/user.controller.ts
var createUser = async (req, res) => {
  try {
    const result = await userService.createUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result.rows[0]
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message
    });
  }
};
var userController = {
  createUser
};

// src/modules/user/user.route.ts
var router = Router();
router.post("/signup", userController.createUser);
var userRoute = router;

// src/modules/auth/auth.route.ts
import { Router as Router2 } from "express";

// src/modules/auth/auth.service.ts
import bcrypt2 from "bcryptjs";
import jwt from "jsonwebtoken";
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(
    `
    SELECT * FROM users WHERE email=$1
    `,
    [email]
  );
  const user = userData.rows[0];
  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials!");
  }
  const matchPassword = await bcrypt2.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Invalid Credentials!!");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  const token = jwt.sign(jwtPayload, config_default.JWT_Secret, {
    expiresIn: "3d"
  });
  const loggedInUser = {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  };
  return loggedInUser;
};
var authService = {
  loginUserIntoDB
};

// src/modules/auth/auth.controller.ts
var loginUser = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 401,
      success: false,
      message: error.message
    });
  }
};
var authController = {
  loginUser
};

// src/modules/auth/auth.route.ts
var router2 = Router2();
router2.post("/login", authController.loginUser);
var authRouter = router2;

// src/modules/issue/issue.route.ts
import { Router as Router3 } from "express";

// src/modules/issue/issue.service.ts
var postIssueIntoDB = async (payload) => {
  const { title, description, type, id } = payload;
  const status = "open";
  const result = await pool.query(
    `
       INSERT INTO issues(reporter_id,title,type,status,description) VALUES($1,$2,$3,$4,$5) RETURNING *
        `,
    [id, title, type, status, description]
  );
  return result;
};
var getAllIssuesFromDB = async (query) => {
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
      role: u.role
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
    updated_at: i.updated_at
  }));
  let filteredIssues = finalIssues;
  if (query.type) {
    filteredIssues = filteredIssues.filter(
      (issue) => issue.type === query.type
    );
  }
  if (query.status) {
    filteredIssues = filteredIssues.filter(
      (issue) => issue.status === query.status
    );
  }
  filteredIssues.sort((a, b) => {
    if (query.sort === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  return filteredIssues;
};
var getSingleIssueFromDB = async (id) => {
  const issueResult = await pool.query(
    `
    SELECT * FROM issues WHERE id=$1
    `,
    [id]
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
      role: u.role
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
    updated_at: issue.updated_at
  };
  return finalIssue;
};
var updateIssueInDB = async (payload, id, loginUser2) => {
  const { title, type, description } = payload;
  const getUserFromDB = await pool.query(
    `
  SELECT * FROM users WHERE id=$1
  `,
    [loginUser2.userId]
  );
  const getIssueFromDB = await pool.query(
    `
  SELECT * FROM issues WHERE id=$1
  `,
    [id]
  );
  if (!getIssueFromDB) {
    throw new Error("Issue not found");
  }
  const role = getUserFromDB.rows[0].role;
  const issue = getIssueFromDB.rows[0];
  if (role !== "maintainer" && !(role === "contributor" && issue.reporter_id === Number(loginUser2.userId) && issue.status === "open")) {
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
    [title, type, description, id]
  );
  if (role === "maintainer" && payload.status) {
    await pool.query(
      `
      UPDATE issues
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [payload.status, id]
    );
  }
  return result;
};
var deleteIssueFromDB = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM issues WHERE id=$1
    `,
    [id]
  );
  return result;
};
var issueService = {
  postIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  deleteIssueFromDB,
  updateIssueInDB
};

// src/modules/issue/issue.controller.ts
var postIssue = async (req, res) => {
  try {
    const payload = {
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      id: req.user?.id
    };
    const result = await issueService.postIssueIntoDB(payload);
    return sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result.rows[0]
    });
  } catch (error) {
    return sendResponse_default(res, {
      statusCode: 500,
      success: false,
      errors: error.message
    });
  }
};
var getAllIssues = async (req, res) => {
  const query = req.query;
  try {
    const result = await issueService.getAllIssuesFromDB(query);
    return sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrived successfully",
      data: result
    });
  } catch (error) {
    return sendResponse_default(res, {
      statusCode: 500,
      success: false,
      errors: error.message
    });
  }
};
var getSingleIssues = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await issueService.getSingleIssueFromDB(id);
    if (!result) {
      return sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found",
        data: {}
      });
    }
    return sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrived successfully",
      data: result
    });
  } catch (error) {
    return sendResponse_default(res, {
      statusCode: 500,
      success: false,
      errors: error.message
    });
  }
};
var updateIssue = async (req, res) => {
  const { id } = req.params;
  const userData = {
    role: req.user?.role,
    userId: req.user?.id
  };
  try {
    const result = await issueService.updateIssueInDB(
      req.body,
      id,
      userData
    );
    if (result.rows.length === 0) {
      sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found"
      });
    }
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result.rows[0]
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      errors: error.message
    });
  }
};
var deleteUser = async (req, res) => {
  const { id } = req.params;
  const role = req.user?.role;
  if (role != "maintainer") {
    return sendResponse_default(res, {
      statusCode: 403,
      success: false,
      errors: "Unauthorized Access"
    });
  }
  try {
    const result = await issueService.deleteIssueFromDB(id);
    if (result.rowCount === 0) {
      return sendResponse_default(res, {
        statusCode: 404,
        success: false,
        errors: "Issue not found!"
      });
    }
    return sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    return sendResponse_default(res, {
      statusCode: 500,
      success: false,
      errors: error.message
    });
  }
};
var issuesController = {
  postIssue,
  getAllIssues,
  getSingleIssues,
  deleteUser,
  updateIssue
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return sendResponse_default(res, {
          statusCode: 401,
          success: false,
          message: "Unauthorized Access"
        });
      }
      const decoded = jwt2.verify(
        token,
        config_default.JWT_Secret
      );
      const userData = await pool.query(
        `
        SELECT * FROM users WHERE email=$1
        `,
        [decoded.email]
      );
      const user = userData.rows[0];
      if (userData.rows.length === 0) {
        return sendResponse_default(res, {
          statusCode: 404,
          success: false,
          message: "User not found!"
        });
      }
      if (roles.length && !roles.includes(user.role)) {
        return sendResponse_default(res, {
          statusCode: 403,
          success: false,
          message: "Role not found!"
        });
      }
      if (user.role != "contributor" && user.role != "maintainer") {
        return sendResponse_default(res, {
          statusCode: 401,
          success: false,
          message: "Unauthorized Access"
        });
      }
      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = auth;

// src/modules/issue/issue.route.ts
var route = Router3();
route.post("/issues", auth_default(), issuesController.postIssue);
route.get("/issues", issuesController.getAllIssues);
route.get("/issues/:id", issuesController.getSingleIssues);
route.delete("/issues/:id", auth_default(), issuesController.deleteUser);
route.patch("/issues/:id", auth_default(), issuesController.updateIssue);
var issueRouter = route;

// src/app.ts
var app = express();
app.use(express.json());
app.get("/", (req, res) => {
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    message: "DevPulse is running"
  });
});
app.use("/api/auth", userRoute);
app.use("/api/auth", authRouter);
app.use("/api", issueRouter);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`The server is running on port : ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map