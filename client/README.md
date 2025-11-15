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
