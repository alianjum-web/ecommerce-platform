// FUNCTION addToCart(request):
// 1. Extract userId from authenticated request.
// 2. If no userId → return 401 "Unauthenticated user".
// 3. Extract productId, quantity, size, color from request body.
// 4. Try to find an existing cart for this user.
//    - If not found, create one.
// 5. Try to find an existing cart item with same:
//       cartId + productId + size + color.
//    - If found → increase quantity.
//    - If not found → create new cart item.
// 6. Fetch product details (name, price, image) to attach in response.
// 7. Return JSON with updated/created cart item.
// 8. If any error happens → return 500.
