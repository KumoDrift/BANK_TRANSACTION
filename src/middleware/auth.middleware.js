import User from "../models/user.model";
import jwt from "jsonwebtoken";
import "dotenv/config";

async function authMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // decoded will contain the payload we signed (userId) when we were creating the token in auth.controller.js
    const user = await User.findById(decoded.userId);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}

export { authMiddleware };
