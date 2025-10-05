// This shows for ALL routes that don't have their own not-found.tsx
export default function GlobalNotFound() {
  return (
    <div className="text-center py-16">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-gray-600 mb-8">
        The page you're looking for doesn't exist.
      </p>
      <a href="/" className="bg-blue-500 text-white px-6 py-2 rounded">
        Go Home
      </a>
    </div>
  );
}