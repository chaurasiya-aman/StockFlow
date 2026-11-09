import jwt from "jsonwebtoken";

export function generateToken(user) {
  return jwt.sign(
    { organizationId: user.organizationId },
    process.env.JWT_SECRET,
    { subject: user.id, expiresIn: "1d" }
  );
}