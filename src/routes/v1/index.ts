import { Router } from "express";
import authRouter from "./auth";

/**
 * This module sets up the main router for the application.
 * It is used to mount all the other route modules.
 */
const v1Router = Router();

v1Router.use("/auth", authRouter);

export default v1Router;
