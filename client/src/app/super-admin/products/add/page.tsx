"use client";

import { Suspense } from "react";
import ProductForm from "@/components/super-admin/ProductForm";

function SuperAdminManageProductPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductForm />
    </Suspense>
  );
}

export default SuperAdminManageProductPage;