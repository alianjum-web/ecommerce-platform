// FUNCTION createPaypalOrder(items, total):
//    1. GET access_token by calling getPaypalAccessToken()
   
//    2. TRANSFORM cart items to PayPal format:
//       FOR EACH item in items:
//          name = item.name
//          description = item.description (or empty string)
//          sku = item.id
//          unit_amount = {
//             currency_code: "USD",
//             value: formatPrice(item.price)  // 2 decimal places
//          }
//          quantity = string version of item.quantity
//          category = "PHYSICAL_GOODS"

//    3. CALCULATE item total:
//       itemTotal = 0
//       FOR EACH paypalItem in paypalItems:
//          price = parseFloat(paypalItem.unit_amount.value)
//          qty = parseInt(paypalItem.quantity)
//          itemTotal += (price * qty)

//    4. CREATE PayPal order payload:
//       {
//          intent: "CAPTURE",
//          purchase_units: [
//             {
//                amount: {
//                   currency_code: "USD",
//                   value: formatPrice(total),
//                   breakdown: {
//                      item_total: {
//                         currency_code: "USD", 
//                         value: formatPrice(itemTotal)
//                      }
//                   }
//                },
//                items: paypalItems
//             }
//          ]
//       }

//    5. MAKE POST request to create order:
//       URL: BASE_URL + "/v2/checkout/orders"
//       HEADERS:
//          - Content-Type: "application/json"
//          - Authorization: "Bearer {access_token}"
//          - PayPal-Request-ID: generateUniqueId()

//    6. RETURN order data to frontend