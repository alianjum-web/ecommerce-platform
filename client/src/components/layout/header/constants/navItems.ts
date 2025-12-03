export const mainNavItems = [
  {
    title: "HOME",
    to: "/",
    icon: "TrendingUp",
  },
  {
    title: "SHOP",
    to: "/products",
    icon: "ShoppingBag",
    megaMenu: true,
  },
  {
    title: "NEW ARRIVALS",
    to: "/new-arrivals",
    icon: "Star",
    badge: "HOT",
  },
  {
    title: "DEALS",
    to: "/deals",
    icon: "Gift",
    badge: "SALE",
    dropdown: [
      { title: "Flash Sales", to: "/deals/flash" },
      { title: "Daily Deals", to: "/deals/daily" },
      { title: "Clearance", to: "/deals/clearance" },
      { title: "Bundles", to: "/deals/bundles" },
    ]
  },
  {
    title: "BRANDS",
    to: "/brands",
    icon: "Tag",
    dropdown: true,
  },
  {
    title: "CATEGORIES",
    to: "/categories",
    icon: "Grid",
    dropdown: true,
  },
];

export const infoItems = [
  { title: "Track Order", to: "/track-order", icon: "Package" },
  { title: "Store Locator", to: "/stores", icon: "MapPin" },
  { title: "Help Center", to: "/help", icon: "HelpCircle" },
  { title: "Contact Us", to: "/contact", icon: "Phone" },
  { title: "About Us", to: "/about", icon: "Info" },
];

