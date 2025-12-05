import express from "express";
import { authenticateJwt, isSuperAdmin } from "../middleware/authMiddleware";
import {
  createPaymentOrder,
  capturePayment,
  getAllOrdersForAdmin,
  getOrder,
  getOrdersByUserId,
  updateOrderStatus,
} from "../controllers/orderController";
import { ApiResponse } from "../utils/ApiResponse";
import { PaymentFactory } from "../services/payment/payment.factory";

const router = express.Router();

router.use(authenticateJwt);

router.post("/create-order", createPaymentOrder);
router.post("/capture-order", capturePayment);

router.get('/methods', (req, res) => {
  const methods = PaymentFactory.getAvailableMethods();
  res.json(new ApiResponse(200, methods, "Available payment methods"));
});

// router.post("/create-final-order", createFinalOrderInDB);
router.get("/get-single-order/:orderId", getOrder);
router.get("/get-order-by-user-id", getOrdersByUserId);
router.get("/get-all-orders-for-admin", isSuperAdmin, getAllOrdersForAdmin);
router.put("/:orderId/status", isSuperAdmin, updateOrderStatus);

export default router;
