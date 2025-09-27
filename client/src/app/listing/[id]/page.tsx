import { Suspense } from "react";
import ProductDetailsSkeleton from "./productSkeleton";
import ProductDetailsContent from "./productDetails";

export default async function ProductDetailsPage({ params }: { params: { id: string } }) {
  const { id } = params;
  return (
    <Suspense fallback={<ProductDetailsSkeleton />}>
      <ProductDetailsContent id={id} />
    </Suspense>
  );
}
