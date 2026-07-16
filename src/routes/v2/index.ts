import { Router } from "express";
import usersRouter from "./users";

/**
 * This module sets up the main router for the application.
 * It is used to mount all the other route modules.
 */
const v2Router = Router();

v2Router.use("/users", usersRouter);

export default v2Router;
