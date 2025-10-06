import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { prisma } from "../server";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";

const addToCart = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response
) => {

  console.log("Entered successfully.");
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json(new ApiError(401, "Unauthorized user"));
  }

  const { productId, quantity, size, color } = req.body;
  // Add this validation
  if (!productId || !quantity) {
    return res.status(400).json(new ApiError(400, "Product ID and quantity are required"));
  }

  const productExisted = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!productExisted) {
    return res.status(404).json(new ApiError(404, "Product does not exists in the database"));

  }
  if (quantity <= 0) {
    return res.status(400).json(new ApiError(400, "Quantity must be greater than 0"))
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

  return res.status(201).json(new ApiResponse(200, responseItem, "Item added to cart."));

});

const getCart = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json(new ApiError(401, "Unauthorized user"));
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: true,
      },
    });

    if (!cart) {
      return res.status(404).json(new ApiError(404, "Cart not found"));
    }

    const cartItemsWithProducts = await Promise.all(
      cart.items.map(async (item) => {
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

    res.status(200).json(
      new ApiResponse(200, cartItemsWithProducts, "Cart fetched successfully")
    );
  } catch (e) {
    res.status(500).json(
      new ApiError(500, "Failed to fetch cart!")
    );
  }
});

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

const clearEntireCart = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json(new ApiError(401, "Unauthenticated user"));
  }

  await prisma.cartItem.deleteMany({
    where: {
      cart: { userId },
    },
  });

  return res.status(200).json(new ApiResponse(200, "cart cleared successfully!"));
});

export {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItemQuantity,
  clearEntireCart,
};
