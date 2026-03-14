import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { protect } from "../middleware/user-middleware.js";
import { fetchPosts, scheduleCreatePost } from "../controller/post-controller.js";

const postRoutes: ExpressRouter = Router();

postRoutes.use(protect);

postRoutes.post('/schedule-create', scheduleCreatePost);
postRoutes.post('/mark-as-read', () => {});
postRoutes.get('/feed', fetchPosts);

export default postRoutes;