import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { protect } from "../middleware/user-middleware.js";
import { getSubscriptionData, syncSubscriptionStatus, updatePolarCustomerId, updateUserTier } from "../controller/subscription-controller.js";

const subscriptionRoutes: ExpressRouter = Router();

subscriptionRoutes.use(protect);

subscriptionRoutes.put('/update/customer', updatePolarCustomerId);
subscriptionRoutes.put('/update/user-tier', updateUserTier);
subscriptionRoutes.get('/data', getSubscriptionData);
subscriptionRoutes.get('/sync', syncSubscriptionStatus);

export default subscriptionRoutes;