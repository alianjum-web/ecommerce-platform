import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { prisma } from "../server";
import { promise, success } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";

const addToCart = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    console.log("Entered successfully.");
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user",
      });

      return;
    }
    const { productId, quantity, size, color } = req.body;
    // Add this validation
    if (!productId || !quantity) {
      res.status(400).json({
        success: false,
        message: "Product ID and quantity are required",
      });
      return;
    }
    const productExisted = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!productExisted) {
      res.status(404).json({
        success: false,
        message: "Product does not exists in the database",
      });
      return;
    }
    if (quantity <= 0) {
      res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
      return;
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
          size: size || null,
          color: color || null,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        cartId: cart.id,
        productId,
        quantity,
        size,
        color,
      },
    });
    console.log("My cart item", cartItem);
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        name: true,
        price: true,
        images: true,
      },
    });
    console.log("Product is here, ", product);

    const responseItem = {
      id: cartItem.id,
      productId: cartItem.productId,
      name: product?.name,
      price: product?.price,
      image: product?.images[0],
      color: cartItem.color,
      size: cartItem.size,
      quantity: cartItem.quantity,
    };

    res.status(201).json({
      success: true,
      data: responseItem,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getCart = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user",
      });

      return;
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {                                      // include = full nested objects
        items: true,
      },
    });

    if (!cart) {
      res.status(404).json({
        success: false,
        messaage: "No Item found in cart",
        data: [],
      });

      return;
    }

    const cartItemsWithProducts = await Promise.all(
      cart?.items.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            name: true,
            price: true,
            images: true,
          },
        });

        return {
          id: item.id,
          productId: item.productId,
          name: product?.name,
          price: product?.price,
          image: product?.images[0],
          color: item.color,
          size: item.size,
          quantity: item.quantity,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: cartItemsWithProducts,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart!",
    });
  }
};
const removeFromCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
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
      cart: { userId }
    }
  });

  return res.status(200).json(
    new ApiResponse(200, null, "Item removed from cart successfully")
  );
});

const updateCartItemQuantity = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { quantity } = req.body;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json(new ApiError(401, "Unauthorized user"));
  }

  if (!id) {
    return res.status(400).json(new ApiError(400, "Item id is required"));
  }

  if (typeof quantity !== 'number' || quantity < 1) {
    return res.status(400).json(new ApiError(400, "Valid quantity is required"));
  }

  const updatedCartItem = await prisma.cartItem.update({
    where: {
      id,
      cart: { userId }
    },
    data: { quantity }
  });

  const product = await prisma.product.findUnique({
    where: { id: updatedCartItem.productId },
    select: {
      images: true,
      name: true,
      price: true,
    }
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

  return res.status(200).json(
    new ApiResponse(200, responseItem, "Cart item quantity updated successfully")
  );
});
const clearEntireCart = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user",
      });

      return;
    }

    await prisma.cartItem.deleteMany({
      where: {
        cart: { userId },
      },
    });

    res.status(200).json({
      success: true,
      message: "cart cleared successfully!",
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Failed to clear cart!",
    });
  }
};

export {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItemQuantity,
  clearEntireCart,
};
