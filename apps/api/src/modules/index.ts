import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import productsRouter from "./products";
import ordersRouter from "./orders";
import favoritesRouter from "./favorites";
import newsletterRouter from "./newsletter";
import adminRouter from "./admin";
import checkoutRouter from "./checkout";
import accountRouter from "./account";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(accountRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(favoritesRouter);
router.use(newsletterRouter);
router.use(adminRouter);
router.use("/checkout", checkoutRouter);
router.use("/webhooks", checkoutRouter);

export default router;
