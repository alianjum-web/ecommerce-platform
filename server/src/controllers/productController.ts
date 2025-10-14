import { Response } from "express";
import { AuthenticatedRequest } from "../types/express";
import cloudinary from "../config/cloudinary";
import { prisma } from "../server";
import { Prisma } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError, ValidationError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { createLogger } from "../utils/logger";

// TODO: Consider cleaning up uploaded Cloudinary images if DB insert failed (use public_id to delete).
// Use Promise.allSettled and handle partial failures gracefully.
const logger = createLogger("PRODUCT_CONTROLLER");

const createProduct = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        name,
        brand,
        description,
        category,
        gender,
        sizes,
        colors,
        price,
        stock,
      } = req.body;

      // ✅ USE SPECIFIC ERROR CLASSES (not direct res.status)
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new ValidationError("No images uploaded"); // ← Better!
      }

      const files = req.files as Express.Multer.File[];

      // Upload images
      const uploadFiles = files.map((file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "ecommerce" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(file.buffer);
        });
      });

      const uploadResults = await Promise.all(uploadFiles);
      const imageUrls = uploadResults.map((result: any) => result.secure_url);

      // Process sizes and colors safely
      const processedSizes = Array.isArray(sizes)
        ? sizes
        : sizes.split(",").map((s: string) => s.trim());

      const processedColors = Array.isArray(colors)
        ? colors
        : colors.split(",").map((c: string) => c.trim());

      // Create product
      const newlyCreatedProduct = await prisma.product.create({
        data: {
          name,
          brand,
          description,
          category,
          gender,
          sizes: processedSizes,
          colors: processedColors,
          price: parseFloat(price),
          stock: parseInt(stock),
          images: imageUrls,
          soldCount: 0,
          rating: 0,
        },
      });

      // ✅ USE LOGGER FOR SUCCESS TOO
      logger.info("Product created successfully", {
        productId: newlyCreatedProduct.id,
        productName: name,
      });

      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            newlyCreatedProduct,
            "Product created successfully."
          )
        );
    } catch (error) {
      // ✅ USE THE ENHANCED LOGGER METHOD
      logger.requestError(error as Error, req, "createProduct");
      throw error; // ← Let the global error handler process it
    }
  }
);

//fetch all products (admin side)
const fetchAllProductsForAdmin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const fetchAllProducts = await prisma.product.findMany();
    res.status(200).json(fetchAllProducts);
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Some error occured!" });
  }
};

//get a single product
const getProductByID = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json(product);
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Some error occured!" });
  }
};
//update  a product (admin)
const updateProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      brand,
      description,
      category,
      gender,
      sizes,
      colors,
      price,
      stock,
      rating,
    } = req.body;

    console.log(req.body, "req.body");

    //homework -> you can also implement image update func

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        brand,
        category,
        description,
        gender,
        sizes: sizes.split(","),
        colors: colors.split(","),
        price: parseFloat(price),
        stock: parseInt(stock),
        rating: parseInt(rating),
      },
    });

    res.status(200).json(product);
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Some error occured!" });
  }
};
//delete a product (admin)
const deleteProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });

    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Some error occured!" });
  }
};

const getProductsForClient = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const categories = ((req.query.categories as string) || "")
      .split(",")
      .filter(Boolean);
    const colors = ((req.query.colors as string) || "")
      .split(",")
      .filter(Boolean);
    const sizes = ((req.query.sizes as string) || "")
      .split(",")
      .filter(Boolean);
    const brands = ((req.query.brands as string) || "")
      .split(",")
      .filter(Boolean);

    const minPrice = parseFloat(req.query.minPrice as string) || 0;
    const maxPrice =
      parseFloat(req.query.maxPrice as string) || Number.MAX_SAFE_INTEGER;

    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrderas as "asc" | "desc") || "desc";

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      AND: [
        categories.length > 0
          ? {
              category: {
                in: categories,
                mode: "insensitive",
              },
            }
          : {},
        brands.length > 0
          ? {
              brand: {
                in: brands,
                mode: "insensitive",
              },
            }
          : {},
        sizes.length > 0
          ? {
              sizes: {
                hasSome: sizes,
              },
            }
          : {},
        colors.length > 0
          ? {
              colors: {
                hasSome: colors,
              },
            }
          : {},
        {
          price: { gte: minPrice, lte: maxPrice },
        },
      ],
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.product.count({ where }),
    ]);

    console.log(
      Math.ceil(total / limit),
      total,
      limit,
      "Math.ceil(total / limit)"
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          products,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalProducts: total,
        },
        "Products fetched for the clients successfully.."
      )
    );
  }
);

export {
  createProduct,
  fetchAllProductsForAdmin,
  getProductByID,
  updateProduct,
  deleteProduct,
  getProductsForClient,
};
