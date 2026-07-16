import type { Logger } from "winston";
import { NODE_ENV } from "../constants";
import { NodeENVEnums } from "../utils/enums";
import buildDevLogger from "./devLogger";
import buildProdLogger from "./prodLogger";
import buildTestLogger from "./testLogger";

function buildLogger(): Logger {
	if (NODE_ENV === NodeENVEnums.DEVELOPMENT) return buildDevLogger();
	if (NODE_ENV === NodeENVEnums.TEST) return buildTestLogger();
	return buildProdLogger();
}

const logger: Logger = buildLogger();

export default logger;
