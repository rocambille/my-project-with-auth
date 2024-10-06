// to make the file a module and avoid the TypeScript error
import type { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    export interface Request {
      auth: JwtPayload & { sub: JwtPayload.sub }; // Make sub mandatory
      /* ************************************************************************* */
      // Add your custom properties here, for example:
      //
      // user?: { ... }
      /* ************************************************************************* */
    }
  }
}
