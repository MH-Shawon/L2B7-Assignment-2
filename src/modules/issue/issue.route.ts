import { Router } from "express";
import { issuesController } from "./issue.controller";
import auth from "../../middleware/auth";

const route = Router();

route.post("/issues", auth(), issuesController.postIssue);
route.get("/issues", issuesController.getAllIssues);
route.get("/issues/:id", issuesController.getSingleIssues);
route.delete("/issues/:id", auth(), issuesController.deleteUser);
route.patch("/issues/:id", auth(), issuesController.updateIssue);

export const issueRouter = route;
