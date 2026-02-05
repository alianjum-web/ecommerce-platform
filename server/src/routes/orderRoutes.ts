import express from "express";
import { authenticateJwt, isSuperAdmin } from "../middleware/authMiddleware";
import {
  createPaymentOrder,
  capturePayment,
  getAllOrdersAdminOnly,
  getOrderById,
  getOrderByIdWithUserAdminOnly,
  updateOrderStatusAdminOnly,
} from "../controllers/orderController";
import { ApiResponse } from "../utils/ApiResponse";
import { PaymentFactory } from "../services/payment/payment.factory";
import { genericWebhook, paypalWebhook, stripeWebhook } from "../controllers/webhook.controller";

const router = express.Router();

router.use(authenticateJwt);

router.post("/create-order", createPaymentOrder);
router.post("/capture-order", capturePayment);

router.post("/webhooks/paypal", 
  express.raw({ type: "application/json" }), 
  paypalWebhook
);

router.post("/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

router.post("/webhooks/:provider", 
  express.raw({ type: "application/json" }),
  genericWebhook
);


router.get('/methods', (req, res) => {
  const methods = PaymentFactory.getAvailableMethods();
  res.json(new ApiResponse(200, methods, "Available payment methods"));
});

// router.post("/create-final-order", createFinalOrderInDB);
router.get("/get-order/:orderId", getOrderById);
router.get("/get-order-with-user/:orderId", isSuperAdmin, getOrderByIdWithUserAdminOnly);
router.get("/get-all-orders-for-admin", isSuperAdmin, getAllOrdersAdminOnly);
router.put("/:orderId/status", isSuperAdmin, updateOrderStatusAdminOnly);

export default router;
