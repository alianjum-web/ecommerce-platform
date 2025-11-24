import { Response } from "express";
import { AuthenticatedRequest } from "../types/express";
import { prisma } from "../server";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError, ValidationError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";

const addToCart = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    console.log("Entered successfully.");
    const rawUserId = req.user?.userId;
    const userId =
      typeof rawUserId === "string" ? parseInt(rawUserId, 10) : rawUserId;

    if (!userId || Number.isNaN(userId)) {
      return res
        .status(401)
        .json(
          new ValidationError("Unauthorized user or userId is not a number.")
        );
    }

    const { productId, quantity, size, color } = req.body;
    if (!productId || !quantity) {
      return res
        .status(400)
        .json(new ApiError(400, "Product ID and quantity are required"));
    }

    const productExisted = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!productExisted) {
      return res
        .status(404)
        .json(new ApiError(404, "Product does not exist in the database"));
    }
    if (quantity <= 0) {
      return res
        .status(400)
        .json(new ApiError(400, "Quantity must be greater than 0"));
    }

    const cart = await prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    console.log("This is cart: ", cart);

    const cartItem = await prisma.cartItem.upsert({
      where: {
        cartId_productId_size_color: {
          cartId: cart.id,
          productId,
          size: size ?? null,
          color: color ?? null,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        cartId: cart.id,
        productId,
        quantity,
        size: size ?? null,
        color: color ?? null,
      },
    });

    console.log("My cart item", cartItem);
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, price: true, images: true },
    });

    const responseItem = {
      id: cartItem.id,
      productId: cartItem.productId,
      name: product?.name,
      price: product?.price,
      image: product?.images?.[0] ?? null,
      color: cartItem.color,
      size: cartItem.size,
      quantity: cartItem.quantity,
    };

    return res
      .status(201)
      .json(new ApiResponse(200, responseItem, "Item added to cart."));
  }
);

const getCart = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const rawUserId = req.user?.userId;
      const userId =
        typeof rawUserId === "string" ? parseInt(rawUserId, 10) : rawUserId;

      if (!userId || Number.isNaN(userId)) {
        return res
          .status(401)
          .json(new ValidationError("Unauthorized user. Invalid userId."));
      }

      // ✅ Single query with joins - much more efficient
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  price: true,
                  images: true,
                  // ✅ Add product availability check
                  status: true,
                  inventory: true,
                }
              }
            }
          },
        },
      });

      // ✅ If cart doesn't exist, return empty array (don't create until needed)
      if (!cart) {
        return res
          .status(200)
          .json(
            new ApiResponse(200, [], "Cart is empty")
          );
      }

      // ✅ Process items in memory (much faster)
      const validCartItems = cart.items
        .filter(item => {
          // ✅ Filter out items with deleted/unavailable products
          if (!item.product) {
            console.warn(`⚠️ Product ${item.productId} not found`);
            return false;
          }
          
          // ✅ Check if product is available
          if (item.product.status !== 'ACTIVE') {
            console.warn(`⚠️ Product ${item.productId} is not active`);
            return false;
          }
          
          return true;
        })
        .map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.product.name,
          price: item.product.price,
          image: item.product.images[0],
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          // ✅ Add product availability info
          available: item.product.inventory > 0,
          maxQuantity: Math.min(item.quantity, item.product.inventory),
        }));

      // ✅ Clean up invalid items in background (non-blocking)
      if (validCartItems.length !== cart.items.length) {
        const invalidItemIds = cart.items
          .filter(item => !item.product || item.product.status !== 'ACTIVE')
          .map(item => item.id);
        
        if (invalidItemIds.length > 0) {
          // Don't await - let it run in background
          prisma.cartItem.deleteMany({
            where: { id: { in: invalidItemIds } }
          }).catch(console.error);
        }
      }

      res
        .status(200)
        .json(
          new ApiResponse(200, validCartItems, "Cart fetched successfully")
        );
    } catch (error) {
      console.error("❌ getCart error:", error);
      res.status(500).json(new ApiError(500, "Failed to fetch cart!"));
    }
  }
);

const removeFromCart = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const rawUserId = req.user?.userId;
    const userId =
      typeof rawUserId === "string" ? parseInt(rawUserId, 10) : rawUserId;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json(new ApiError(400, "Item id is required"));
    }

    if (!userId) {
      return res.status(401).json(new ApiError(401, "Unauthorized user"));
    }

    await prisma.cartItem.delete({
      where: {
        id,
        cart: { userId },
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Item removed from cart successfully"));
  }
);

const updateCartItemQuantity = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const rawUserId = req.user?.userId;
    const userId =
      typeof rawUserId === "string" ? parseInt(rawUserId, 10) : rawUserId;
    const { quantity } = req.body;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json(new ApiError(401, "Unauthorized user"));
    }

    if (!id) {
      return res.status(400).json(new ApiError(400, "Item id is required"));
    }

    if (typeof quantity !== "number" || quantity < 1) {
      return res
        .status(400)
        .json(new ApiError(400, "Valid quantity is required"));
    }

    const updatedCartItem = await prisma.cartItem.update({
      where: {
        id,
        cart: { userId },
      },
      data: { quantity },
    });

    const product = await prisma.product.findUnique({
      where: { id: updatedCartItem.productId },
      select: {
        images: true,
        name: true,
        price: true,
      },
    });

    const responseItem = {
      id: updatedCartItem.id,
      productId: updatedCartItem.productId,
      name: product?.name,
      price: product?.price,
      image: product?.images[0],
      color: updatedCartItem.color,
      size: updatedCartItem.size,
      quantity: updatedCartItem.quantity,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          responseItem,
          "Cart item quantity updated successfully"
        )
      );
  }
);
// all the items in the cart with the userId - for 1 item use delete()
const clearEntireCart = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const rawUserId = req.user?.userId;
    const userId =
      typeof rawUserId === "string" ? parseInt(rawUserId, 10) : rawUserId;

    if (!userId) {
      return res.status(401).json(new ApiError(401, "Unauthenticated user"));
    }

    await prisma.cartItem.deleteMany({
      where: {
        cart: { userId },
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "cart cleared successfully!"));
  }
);

export {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItemQuantity,
  clearEntireCart,
};
