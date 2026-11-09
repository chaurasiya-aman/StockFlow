import bcrypt from "bcryptjs";
import { prisma } from "../db/prisma.js";
import { generateToken } from "../utils/generateToken.js";

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    organizationId: user.organizationId,
    organization: user.organization,
  };
}

export async function signup(req, res, next) {
  const { email, password, organizationName } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string" ||
      typeof organizationName !== "string") {
    return res.status(400).json({ error: "Email, password, and organization name are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedOrganizationName = organizationName.trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
      normalizedEmail.length > 254) {
    return res.status(400).json({ error: "Enter a valid email address" });
  }

  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    return res.status(400).json({ error: "Password must be at least 8 characters and no more than 72 bytes" });
  }

  if (!normalizedOrganizationName || normalizedOrganizationName.length > 100) {
    return res.status(400).json({ error: "Organization name must be 1 to 100 characters" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        organization: {
          create: { name: normalizedOrganizationName },
        },
      },
      select: {
        id: true,
        email: true,
        organizationId: true,
        organization: {
          select: { id: true, name: true, defaultLowStockThreshold: true },
        },
      },
    });

    return res.status(201).json({
      token: generateToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    return next(error);
  }
}

export async function login(req, res, next) {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: {
        organization: {
          select: { id: true, name: true, defaultLowStockThreshold: true },
        },
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    return res.json({
      token: generateToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

export async function getCurrentUser(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: {
        id: true,
        email: true,
        organizationId: true,
        organization: {
          select: { id: true, name: true, defaultLowStockThreshold: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
}