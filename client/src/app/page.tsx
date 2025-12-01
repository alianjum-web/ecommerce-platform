"use client";

import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useEffect, useState } from "react";

const gridItems = [
  {
    title: "WOMEN",
    subtitle: "From world's top designer",
    image:
      "https://images.unsplash.com/photo-1614251056216-f748f76cd228?q=80&w=1974&auto=format&fit=crop",
  },
  {
    title: "FALL LEGENDS",
    subtitle: "Timeless cool weather",
    image:
      "https://avon-demo.myshopify.com/cdn/shop/files/demo1-winter1_600x.png?v=1733380268",
  },
  {
    title: "ACCESSORIES",
    subtitle: "Everything you need",
    image:
      "https://avon-demo.myshopify.com/cdn/shop/files/demo1-winter4_600x.png?v=1733380275",
  },
  {
    title: "HOLIDAY SPARKLE EDIT",
    subtitle: "Party season ready",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1974&auto=format&fit=crop",
  },
];

function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { banners, featuredProducts, fetchFeaturedProducts, fetchBanners } =
    useSettingsStore();

  useEffect(() => {
    fetchBanners();
    fetchFeaturedProducts();
  }, [fetchBanners, fetchFeaturedProducts]);

  useEffect(() => {
    const bannerTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(bannerTimer);
  }, [banners.length]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner Section */}
      <section className="relative h-[600px] overflow-hidden">
        {banners.map((bannerItem, index) => (
          <div
            className={`absolute inset-0 transition-opacity duration-1000 ${
              currentSlide === index ? "opacity-100" : "opacity-0"
            }`}
            key={bannerItem.id}
          >
            <div className="absolute inset-0">
              <img
                src={bannerItem.imageUrl}
                alt={`Banner ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Overlay with theme-aware colors */}
              <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
            </div>
            <div className="relative h-full container mx-auto px-4 flex items-center">
              <div className="text-foreground space-y-6 max-w-xl">
                {/* Subtitle with accent color */}
                <span className="text-sm uppercase tracking-wider text-accent font-semibold">
                  I AM JOHN
                </span>
                
                {/* Main heading with glow effect */}
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-glow">
                  BEST SELLING
                  <br />
                  <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    E-COMMERCE WEBSITE
                  </span>
                </h1>
                
                {/* Description text */}
                <p className="text-lg text-muted-foreground">
                  A Creative, Flexible , Clean, Easy to use and
                  <br />
                  High Performance E-Commerce Theme
                </p>
                
                {/* Primary CTA Button */}
                <Button className="bg-primary text-primary-foreground hover:bg-primary-light px-8 py-6 text-lg rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25">
                  SHOP NOW
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        {/* Pagination dots */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentSlide === index
                  ? "bg-primary w-6"  // Active dot uses primary color
                  : "bg-muted-foreground/50 hover:bg-muted-foreground/75"  // Inactive dots
              }`}
            />
          ))}
        </div>
      </section>

      {/* Grid Section */}
      <section className="py-16 bg-card/50">  {/* Semi-transparent card background */}
        <div className="container mx-auto px-4">
          {/* Section header */}
          <div className="text-center mb-12">
            <span className="text-sm uppercase tracking-wider text-secondary font-semibold mb-2 block">
              Featured Collection
            </span>
            <h2 className="text-3xl font-bold text-foreground mb-3">
              THE WINTER EDIT
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Designed to keep your satisfaction and warmth with our futuristic winter collection
            </p>
          </div>
          
          {/* Grid items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {gridItems.map((gridItem, index) => (
              <div 
                key={index} 
                className="group relative overflow-hidden rounded-xl border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
              >
                {/* Image container */}
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={gridItem.image}
                    alt={gridItem.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent flex items-end justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6">
                  <div className="text-center w-full">
                    {/* Title with glass effect */}
                    <div className="glass-effect rounded-lg p-4 mb-4 backdrop-blur-sm">
                      <h3 className="text-xl font-bold text-foreground mb-1">
                        {gridItem.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {gridItem.subtitle}
                      </p>
                    </div>
                    
                    {/* Button with secondary color */}
                    <Button className="bg-secondary text-secondary-foreground hover:bg-secondary-light w-full py-3 rounded-lg transition-colors">
                      SHOP NOW
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          {/* Section header */}
          <div className="text-center mb-12">
            <span className="text-sm uppercase tracking-wider text-accent font-semibold mb-2 block">
              Latest Drops
            </span>
            <h2 className="text-3xl font-bold text-foreground mb-3">
              NEW ARRIVALS
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Shop our new arrivals from established brands in the futuristic fashion space
            </p>
          </div>
          
          {/* Products grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((productItem, index) => (
              <div 
                key={index} 
                className="group bg-card border border-border rounded-xl overflow-hidden hover:border-accent/30 transition-all duration-300 hover:shadow-lg"
              >
                {/* Product image */}
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={productItem.images[0]}
                    alt={productItem.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                
                {/* Product info */}
                <div className="p-4">
                  {/* Category badge */}
                  <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs rounded-full mb-2">
                    NEW
                  </span>
                  
                  {/* Product name */}
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {productItem.name}
                  </h3>
                  
                  {/* Product price */}
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">
                      {productItem.price}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      {/* {productItem.compareAtPrice} */}
                    </span>
                  </div>
                </div>
                
                {/* Quick view button - appears on hover */}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4">
                  <div className="space-y-3 w-full px-4">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary-light w-full py-3 rounded-lg">
                      QUICK VIEW
                    </Button>
                    <Button className="bg-secondary text-secondary-foreground hover:bg-secondary-light w-full py-3 rounded-lg">
                      ADD TO CART
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* View all button */}
          <div className="text-center mt-12">
            <Button className="bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-3 rounded-lg text-lg transition-all duration-300 hover:neon-border">
              VIEW ALL PRODUCTS
            </Button>
          </div>
        </div>
      </section>

      {/* Additional futuristic section */}
      <section className="py-16 bg-gradient-to-br from-background via-card to-background">
        <div className="container mx-auto px-4">
          <div className="glass-effect rounded-2xl p-8 md:p-12 text-center max-w-4xl mx-auto">
            <div className="inline-block px-4 py-1 bg-gradient-to-r from-primary to-secondary rounded-full mb-6">
              <span className="text-sm font-semibold text-white">EXCLUSIVE OFFER</span>
            </div>
            
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Experience Futuristic Shopping
            </h2>
            
            <p className="text-muted-foreground text-lg mb-8">
              Get 20% off on your first purchase with our futuristic collection. 
              Immerse yourself in next-generation fashion design.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-primary text-primary-foreground hover:bg-primary-light px-8 py-4 text-lg rounded-lg">
                CLAIM YOUR DISCOUNT
              </Button>
              <Button className="bg-transparent border border-border text-foreground hover:bg-card px-8 py-4 text-lg rounded-lg">
                LEARN MORE
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;