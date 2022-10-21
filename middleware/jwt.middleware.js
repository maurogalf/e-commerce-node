import { jwtVerify } from "../tools/jwt.js";

class JwtMiddleware {
  tokenVerify(req, res, next) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const result = jwtVerify(token);
      next();
    } catch (err) {
      res.status(401).send({ Error: err.message });
    }
  }
}

export const jwtMiddleware = new JwtMiddleware();
