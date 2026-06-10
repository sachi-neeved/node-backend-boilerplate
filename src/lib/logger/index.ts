import type { Logger } from "winston";
import { NODE_ENV } from "../constants";
import { NodeENVEnums } from "../utils/enums";
import buildDevLogger from "./devLogger";
import buildProdLogger from "./prodLogger";

const logger: Logger = NODE_ENV === NodeENVEnums.DEVELOPMENT ? buildDevLogger() : buildProdLogger();

export default logger;
