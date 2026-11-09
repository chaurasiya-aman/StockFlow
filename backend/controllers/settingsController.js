import { prisma } from "../db/prisma.js";

export async function getSettings(req, res, next) {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: req.auth.organizationId },
      select: { defaultLowStockThreshold: true },
    });

    if (!organization) return res.status(404).json({ error: "Organization not found" });
    return res.json(organization);
  } catch (error) {
    return next(error);
  }
}

export async function updateSettings(req, res, next) {
  const threshold = req.body?.defaultLowStockThreshold;
  if (!Number.isInteger(threshold) || threshold < 0 || threshold > 2147483647) {
    return res.status(400).json({ error: "Default low-stock threshold must be a whole number from 0 to 2147483647" });
  }

  try {
    const result = await prisma.organization.updateMany({
      where: { id: req.auth.organizationId },
      data: { defaultLowStockThreshold: threshold },
    });

    if (result.count === 0) return res.status(404).json({ error: "Organization not found" });
    return res.json({ defaultLowStockThreshold: threshold });
  } catch (error) {
    return next(error);
  }
}
