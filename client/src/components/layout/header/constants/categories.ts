export const categoryItems = [
  {
    title: "Electronics",
    icon: "Smartphone",
    subcategories: [
      { title: "Smartphones", to: "/category/electronics/smartphones", popular: true },
      { title: "Laptops", to: "/category/electronics/laptops", popular: true },
      { title: "Wearables", to: "/category/electronics/wearables" },
      { title: "Audio", to: "/category/electronics/audio", sale: true },
      { title: "Gaming", to: "/category/electronics/gaming" },
      { title: "Cameras", to: "/category/electronics/cameras" },
    ],
    featured: [
      { title: "Apple", to: "/brand/apple", image: "/apple.jpg" },
      { title: "Samsung", to: "/brand/samsung", image: "/samsung.jpg" },
    ]
  },
  {
    title: "Fashion",
    icon: "Shirt",
    subcategories: [
      { title: "Men", to: "/category/fashion/men", new: true },
      { title: "Women", to: "/category/fashion/women" },
      { title: "Kids", to: "/category/fashion/kids" },
      { title: "Accessories", to: "/category/fashion/accessories" },
      { title: "Footwear", to: "/category/fashion/footwear", popular: true },
      { title: "Sportswear", to: "/category/fashion/sportswear" },
    ]
  },
  // Add more categories...
];