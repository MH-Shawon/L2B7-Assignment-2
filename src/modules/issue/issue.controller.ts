import type { Request, Response } from "express";
import { issueService } from "./issue.service";
import sendResponse from "../../utility/sendResponse";

// create Issue
const postIssue = async (req: Request, res: Response) => {
  try {
    const payload = {
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      id: req.user?.id,
    };
    const result = await issueService.postIssueIntoDB(payload);
    return sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    return sendResponse(res, {
      statusCode: 500,
      success: false,
      errors: error.message,
    });
  }
};

// Get all issues
const getAllIssues = async (req: Request, res: Response) => {
  const query = req.query;

  try {
    const result = await issueService.getAllIssuesFromDB(query);
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrived successfully",
      data: result,
    });
  } catch (error: any) {
    return sendResponse(res, {
      statusCode: 500,
      success: false,
      errors: error.message,
    });
  }
};

const getSingleIssues = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await issueService.getSingleIssueFromDB(id as string);

    if (!result) {
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found",
        data: {},
      });
    }
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrived successfully",
      data: result,
    });
  } catch (error: any) {
    return sendResponse(res, {
      statusCode: 500,
      success: false,
      errors: error.message,
    });
  }
};

// Update a issue
const updateIssue = async (req: Request, res: Response) => {
  const { id } = req.params; //Issue id

  const userData = {
    role: req.user?.role,
    userId: req.user?.id,
  };

  try {
    const result = await issueService.updateIssueInDB(
      req.body,
      id as string,
      userData,
    );

    if (result.rows.length === 0) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found",
      });
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      errors: error.message,
    });
  }
};

// Delete a issue
const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const role = req.user?.role;
  if (role != "maintainer") {
    return sendResponse(res, {
      statusCode: 403,
      success: false,
      errors: "Unauthorized Access",
    });
  }

  try {
    const result = await issueService.deleteIssueFromDB(id as string);
    if (result.rowCount === 0) {
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        errors: "Issue not found!",
      });
    }
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error: any) {
    return sendResponse(res, {
      statusCode: 500,
      success: false,
      errors: error.message,
    });
  }
};

export const issuesController = {
  postIssue,
  getAllIssues,
  getSingleIssues,
  deleteUser,
  updateIssue,
};
