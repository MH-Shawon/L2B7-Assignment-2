import type { NextFunction, Request, Response } from "express";
import type { ROLES } from "../types";
declare const auth: (...roles: ROLES[]) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export default auth;
//# sourceMappingURL=auth.d.ts.map