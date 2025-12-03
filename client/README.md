This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.


## Frontend Changes Needed 🔄
Based on your new ApiResponse and ApiError classes, your frontend needs to handle this structure:

Success Response Format:
```ts
{
  success: boolean,    // true
  message: string,     // Your message
  data: T,            // Your actual data (responseItem, null, etc.)
  statusCode: number   // HTTP status code
}
```
#### Error Response Format:
```ts
{
  success: boolean,    // false
  message: string,     // Error message
  data: null,          // Always null for errors
  statusCode: number,  // HTTP status code
  errors: any[]        // Additional error details
}
```
#### Frontend Adaptation Examples:
##### Before:
```ts
// Old way
const response = await api.delete(`/cart/${itemId}`);
if (response.data.success) {
  console.log(response.data.message);
}
```
##### After:

```ts
// New way - you might need to create an interceptor
const response = await api.delete(`/cart/${itemId}`);
const apiResponse = response.data;

if (apiResponse.success) {
  console.log(apiResponse.message);
  // Access data: apiResponse.data
} else {
  console.error(apiResponse.message);
  // Access errors: apiResponse.errors
}
```
##### Recommended Frontend Utilities:
```ts

// api.ts - Axios interceptor
api.interceptors.response.use(
  (response) => {
    // Success responses already follow ApiResponse format
    return response;
  },
  (error) => {
    // You might want to transform error responses
    if (error.response?.data) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);


// Custom hook for API calls
const useApi = () => {
  const handleResponse = (response: any) => {
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message);
    }
  };

  return { handleResponse };
};
```
#### Key Improvements Made:
✅ Added return statements after sending responses

✅ Correct HTTP status codes (400 for bad requests, 401 for unauthorized)

✅ Proper data passing to ApiResponse

✅ Input validation for quantity

✅ Consistent response structure


# TODO
- Handle the pagination from the server for the controller fetchAllProductsForAdmin
- add pino logger in teh app/api/auth which is acting as a proxy: NextJS server accepts the request validates it 
  and send to the actual backend and forwared the response such as cookies back to the client.
- Centralize the error shape for consitent errro.
- Reduce login latency currently the abortcontroller in the app/login is set to 20 make it to 10 and functional




## Request Response Flow 
### Local direct call
Browser → backend(localhost:4001/login) → backend sets cookies for localhost:4001 → browser stores localhost:4001 cookies

### Production proxy call
Browser(yourapp.com) → yourapp.com/api/auth/login → Next.js proxy → forwards to backend-service.com/login → backend sets backend-service.com cookies → proxy rewrites cookies → browser stores yourapp.com cookies

# DREAM FEATURES: 
Logged In:

Profile picture & name

Account dashboard

Order history

Wishlist

Recently viewed

Compare list

Address book

Payment methods

Reviews

Returns & refunds

Logout

Logged Out:

Sign In → /auth/login

Register → /auth/register

Guest checkout option

Track order without login

6. WISHLIST CLICK:
text
Click Heart Icon → Wishlist page
List of saved items

Price drop alerts

Back-in-stock notifications

Move to cart option

Create multiple wishlists

Share wishlist feature

7. NEW ARRIVALS:
text
Click New Arrivals → `/new-arrivals`
- Filter by date (Last 7/30/90 days)
- "Just Added" badge
- Pre-order options
- Launch calendar
- Coming soon preview

#### **8. DEALS/SPECIAL OFFERS:**
Click Deals → /deals

text
**Types:**
- Flash Sales (countdown timer)
- Daily Deals
- Clearance
- Bundle offers
- Member-only deals
- Seasonal sales
- BOGO offers

#### **9. TRACK ORDER:**
Click Track Order → /track-order

Input order number & email

Real-time tracking map

Delivery updates

Delivery person contact

Reschedule option

Delivery instructions

10. COMPARE PRODUCTS:
text
Add items to compare → Click Compare → `/compare`
- Side-by-side comparison
- Feature comparison table
- Price comparison
- Rating comparison
- Pros/cons list
- "Best for" recommendations

#### **11. STORE LOCATOR:**
Click Store Locator → /stores

Interactive map

Search by location

Store hours

In-store inventory

Pickup options

Store events

12. NOTIFICATIONS:
text
Click Bell Icon → Notifications panel
Types:

Order updates

Price drop alerts

Back in stock

New arrivals matching interests

Promotions

Abandoned cart reminders

Birthday offers

13. QUICK ACTIONS:
Reorder: Quick repeat last order

Quick Buy: Buy now without cart

Schedule Purchase: Set delivery date

Gift Wrap: Add gift options

Subscribe: Regular delivery

Share: Share product/page

Additional Features for Premium E-commerce:
Personalized Recommendations

Quick View (modal popup on product hover)

Recently Viewed carousel

Browsing History

Multi-currency support

Size/Color swatches in menu

Inventory status (Low stock alerts)

Estimated delivery date calculator

Installment calculator

Gift card balance display

Loyalty points counter

Live chat integration

AR/3D View indicator

Sustainability badges

Product video thumbnails

Mobile-Specific Behavior:
Bottom Navigation Bar (optional for quick access)

Swipe gestures to open cart/wishlist

Pull to refresh on category pages

Haptic feedback on interactions

Voice search integration

Barcode scanner in search

Location-based store detection

App-like PWA features

Offline mode support

Push notifications opt-in

