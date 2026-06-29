import { Router } from "express";
import { userController } from "./user.controller";

const router = Router();

// Create User
router.post("/signup", userController.createUser);

export const userRoute = router;
