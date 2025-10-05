import { Suspense } from "react";
import ProductDetailsSkeleton from "./productSkeleton";
import ProductDetailsContent from "./productDetails";
import { notFound } from 'next/navigation';

export default async function ProductDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  try {
    const { id } = await params;
    
    // ✅ Optional: Validate the ID
    if (!id || typeof id !== 'string') {
      notFound(); // Show 404 page
    }
    
    return (
      <Suspense fallback={<ProductDetailsSkeleton />}>
        <ProductDetailsContent id={id} />
      </Suspense>
    );
  } catch (error) {
    // ✅ Handle any errors during params resolution
    console.error('Error resolving params:', error);
    notFound();
  }
}