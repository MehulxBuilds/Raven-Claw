import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { protect } from "../middleware/user-middleware.js";
import { updateUserpreference } from "../controller/user-controller.js";

const userRoutes: ExpressRouter = Router();

userRoutes.use(protect);

userRoutes.put('/preference', updateUserpreference);

export default userRoutes;