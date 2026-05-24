import { ACTION_TO_ROUTE } from "@/constants/toolRoute.constants";

export type ToolAction = keyof typeof ACTION_TO_ROUTE;
export type ToolRoute = (typeof ACTION_TO_ROUTE)[ToolAction];
