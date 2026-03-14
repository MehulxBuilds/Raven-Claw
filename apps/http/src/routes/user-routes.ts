import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { protect } from "../middleware/user-middleware.js";
import { getDBUser, updateUserpreference } from "../controller/user-controller.js";

const userRoutes: ExpressRouter = Router();

userRoutes.use(protect);

userRoutes.put('/preference', updateUserpreference);
userRoutes.get('/fetch-user', getDBUser);

export default userRoutes;