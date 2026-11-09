import { prisma } from "../db/prisma.js";

function validateProduct(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "A product object is required" };
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const sku = typeof body.sku === "string" ? body.sku.trim() : "";
  const description = body.description ?? null;
  const quantityOnHand = body.quantityOnHand ?? 0;
  const costPrice = body.costPrice ?? 0;
  const sellingPrice = body.sellingPrice ?? 0;
  const lowStockThreshold = body.lowStockThreshold ?? null;

  if (!name || name.length > 120) {
    return { error: "Product name must be between 1 and 120 characters" };
  }

  if (!sku || sku.length > 100) {
    return { error: "SKU must be between 1 and 100 characters" };
  }

  if (description !== null && typeof description !== "string") {
    return { error: "Description must be text" };
  }

  if (typeof description === "string" && description.length > 1000) {
    return { error: "Description must be 1000 characters or less" };
  }

  if (!Number.isInteger(quantityOnHand) || quantityOnHand < 0 || quantityOnHand > 2147483647) {
    return { error: "Quantity must be a whole number from 0 to 2147483647" };
  }

  if (
    typeof costPrice !== "number" ||
    !Number.isFinite(costPrice) ||
    costPrice < 0 ||
    typeof sellingPrice !== "number" ||
    !Number.isFinite(sellingPrice) ||
    sellingPrice < 0
  ) {
    return { error: "Prices must be non-negative numbers" };
  }

  if (
    lowStockThreshold !== null &&
    (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0 || lowStockThreshold > 2147483647)
  ) {
    return { error: "Low-stock threshold must be a whole number from 0 to 2147483647" };
  }

  return {
    data: {
      name,
      sku,
      description:
        typeof description === "string" ? description.trim() || null : null,
      quantityOnHand,
      costPrice,
      sellingPrice,
      lowStockThreshold,
    },
  };
}

function handleProductError(error, res, next) {
  if (error.code === "P2002") {
    return res
      .status(409)
      .json({ error: "That SKU is already used in your organization" });
  }

  return next(error);
}

export async function getProducts(req, res, next) {
  try {
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const where = { organizationId: req.auth.organizationId };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return res.json({ products });
  } catch (error) {
    return next(error);
  }
}

export async function getProduct(req, res, next) {
  try {
    const product = await prisma.product.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.auth.organizationId,
      },
    });

    if (!product) return res.status(404).json({ error: "Product not found" });
    return res.json({ product });
  } catch (error) {
    return next(error);
  }
}

export async function createProduct(req, res, next) {
  const result = validateProduct(req.body);
  if (result.error) return res.status(400).json({ error: result.error });

  try {
    const product = await prisma.product.create({
      data: {
        ...result.data,
        organizationId: req.auth.organizationId,
      },
    });

    return res.status(201).json({ product });
  } catch (error) {
    return handleProductError(error, res, next);
  }
}

export async function updateProduct(req, res, next) {
  const result = validateProduct(req.body);
  if (result.error) return res.status(400).json({ error: result.error });

  try {
    const update = await prisma.product.updateMany({
      where: {
        id: req.params.id,
        organizationId: req.auth.organizationId,
      },
      data: result.data,
    });

    if (update.count === 0)
      return res.status(404).json({ error: "Product not found" });

    const product = await prisma.product.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.auth.organizationId,
      },
    });

    return res.json({ product });
  } catch (error) {
    return handleProductError(error, res, next);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const result = await prisma.product.deleteMany({
      where: {
        id: req.params.id,
        organizationId: req.auth.organizationId,
      },
    });

    if (result.count === 0)
      return res.status(404).json({ error: "Product not found" });
    return res.status(204).end();

  } catch (error) {
    return next(error);
  }
}

export async function getDashboard(req, res, next) {
  try {
    const organizationId = req.auth.organizationId;
    const [summary, organization, products] = await Promise.all([
      prisma.product.aggregate({
        where: { organizationId },
        _count: { _all: true },
        _sum: { quantityOnHand: true },
      }),
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { defaultLowStockThreshold: true },
      }),
      prisma.product.findMany({
        where: { organizationId },
        select: {
          id: true,
          name: true,
          sku: true,
          quantityOnHand: true,
          lowStockThreshold: true,
        },
        orderBy: { quantityOnHand: "asc" },
      }),
    ]);

    if (!organization) return res.status(404).json({ error: "Organization not found" });

    const lowStockProducts = products
      .filter((product) => product.quantityOnHand <= (product.lowStockThreshold ?? organization.defaultLowStockThreshold))
      .map((product) => ({
        ...product,
        lowStockThreshold: product.lowStockThreshold ?? organization.defaultLowStockThreshold,
      }));

    return res.json({
      totalProducts: summary._count._all,
      totalQuantityOnHand: summary._sum.quantityOnHand ?? 0,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
    });
  } catch (error) {
    return next(error);
  }
}
