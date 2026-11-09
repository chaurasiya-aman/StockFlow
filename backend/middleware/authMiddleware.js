import jwt from "jsonwebtoken";

export function authenticateUser(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = jwt.verify(
      authorization.slice(7),
      process.env.JWT_SECRET
    );

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      typeof payload.organizationId !== "string"
    ) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.auth = {
      userId: payload.sub,
      organizationId: payload.organizationId,
    };

    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}