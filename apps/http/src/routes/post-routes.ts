import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { protect } from "../middleware/user-middleware";
import { updateUserpreference } from "../controller/user-controller";
import { scheduleCreatePost } from "../controller/post-controller";

const postRoutes: ExpressRouter = Router();

postRoutes.use(protect);

postRoutes.post('/schedule-create', scheduleCreatePost);
postRoutes.post('/mark-')

export default postRoutes;