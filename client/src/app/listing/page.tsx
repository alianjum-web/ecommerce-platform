"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProductStore } from "@/store/useProductStore";
import { useProductFilters } from "@/hooks/useProductFilter";
import { ProductFilters as FiltersComponent } from "@/components/products/ProductFilters";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Pagination } from "@/components/products/ProductPagination";
import { handleApiError } from "@/utils/errHandler";
import { SlidersHorizontal } from "lucide-react";
import { useEffect, useCallback } from "react";

function ProductListingPage() {
  const {
    priceRange,
    setPriceRange,
    selectedCategories,
    selectedSizes,
    selectedColors,
    selectedBrands,
    sortBy,
    sortOrder,
    handleToggleFilter,
    handleSortChange,
    getFilters,
  } = useProductFilters();

  const {
    products,
    currentPage,
    totalPages,
    totalProducts,
    setCurrentPage,
    fetchProductsForClient,
    isLoading,
    error,
  } = useProductStore();

  // Use useCallback with proper dependencies
  const fetchAllProducts = useCallback(() => {
    const filters = getFilters();
    fetchProductsForClient({
      ...filters,
      page: currentPage,
      limit: 12, // Increased from 5 for better UX
    });
  }, [currentPage, getFilters, fetchProductsForClient]);

  // Use useEffect with stable dependencies
  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts, currentPage]); // Added currentPage as dependency

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add error boundary for 401 errors
  useEffect(() => {
    if (error) {
      console.error('Product fetch error:', handleApiError(error));
      // You might want to handle authentication errors here
      if (error.includes('401') || error.includes('unauthorized')) {
        // Redirect to login or show auth modal
        console.warn('Authentication may be required');
      }
    }
  }, [error]);

// Add this inside your ProductListingPage component, before the return statement
const DebugInfo = () => {
  const { products, isLoading, error, currentPage, totalPages, totalProducts } = useProductStore();
  
  console.log("🛠️ DEBUG - Current State:", {
    products,
    productsLength: products?.length,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalProducts
  });

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs z-50 opacity-80">
      <div>🛠️ DEBUG INFO:</div>
      <div>Products: {products?.length || 0}</div>
      <div>Loading: {isLoading.toString()}</div>
      <div>Error: {error || 'none'}</div>
      <div>Page: {currentPage}/{totalPages}</div>
      <div>Total: {totalProducts}</div>
    </div>
  );
};


  return (
    <div>
    <div className="min-h-screen bg-white">
      <div className="relative h-[300px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop"
          alt="Listing Page Banner"
          className="w-full object-cover h-full"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-2">HOT COLLECTION</h1>
            <p className="text-lg">Discover our latest collection</p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold">All Products</h2>
          <div className="flex items-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[90vw] max-h-[600px] overflow-auto max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Filters</DialogTitle>
                </DialogHeader>
                <FiltersComponent
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  selectedCategories={selectedCategories}
                  selectedSizes={selectedSizes}
                  selectedColors={selectedColors}
                  selectedBrands={selectedBrands}
                  onToggleFilter={handleToggleFilter}
                />
              </DialogContent>
            </Dialog>
            
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Featured</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="createdAt-asc">Newest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex gap-8">
          <div className="hidden lg:block w-64 flex-shrink-0">
            <FiltersComponent
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              selectedCategories={selectedCategories}
              selectedSizes={selectedSizes}
              selectedColors={selectedColors}
              selectedBrands={selectedBrands}
              onToggleFilter={handleToggleFilter}
            />
          </div>
          
          <div className="flex-1">
            <ProductGrid
              products={products}
              isLoading={isLoading}
              error={error}
            />
            
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </div>
     <DebugInfo />
     </div>
  );
}

export default ProductListingPage;