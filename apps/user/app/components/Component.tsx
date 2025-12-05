import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const FoodDeliveryCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const banners = [
    {
      id: 1,
      title: "50% OFF",
      subtitle: "On Your First Order",
      description: "Use code: FIRST50",
      bgGradient: "from-orange-500 via-red-500 to-pink-500",
      image: "🍕",
      cta: "Order Now"
    },
    {
      id: 2,
      title: "Free Delivery",
      subtitle: "On Orders Above $30",
      description: "Limited time offer",
      bgGradient: "from-purple-500 via-indigo-500 to-blue-500",
      image: "🍔",
      cta: "Explore Menu"
    },
    {
      id: 3,
      title: "Weekend Special",
      subtitle: "Buy 1 Get 1 Free",
      description: "On selected items",
      bgGradient: "from-green-500 via-teal-500 to-cyan-500",
      image: "🍜",
      cta: "View Deals"
    },
    {
      id: 4,
      title: "Premium Plus",
      subtitle: "Unlimited Free Delivery",
      description: "Subscribe now at $9.99/mo",
      bgGradient: "from-yellow-500 via-orange-500 to-red-500",
      image: "⭐",
      cta: "Subscribe"
    }
  ];

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, banners.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="relative overflow-hidden rounded-3xl shadow-2xl">
        {/* Carousel Container */}
        <div 
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="min-w-full"
            >
              <div className={`bg-gradient-to-br ${banner.bgGradient} p-8 md:p-12 lg:p-16 min-h-[400px] flex items-center justify-between`}>
                <div className="flex-1 text-white space-y-4 animate-fadeIn">
                  <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                    {banner.description}
                  </div>
                  <h1 className="text-5xl md:text-7xl font-bold leading-tight drop-shadow-lg">
                    {banner.title}
                  </h1>
                  <p className="text-2xl md:text-3xl font-medium opacity-90">
                    {banner.subtitle}
                  </p>
                  <button className="mt-6 px-8 py-4 bg-white text-gray-900 rounded-full font-bold text-lg hover:scale-105 transform transition-all duration-200 shadow-xl hover:shadow-2xl">
                    {banner.cta}
                  </button>
                </div>
                
                <div className="hidden md:block text-9xl animate-bounce-slow ml-8">
                  {banner.image}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 backdrop-blur-sm hover:bg-white/50 text-white p-3 rounded-full transition-all duration-200 hover:scale-110"
          aria-label="Previous slide"
        >
          <ChevronLeft size={28} />
        </button>
        
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 backdrop-blur-sm hover:bg-white/50 text-white p-3 rounded-full transition-all duration-200 hover:scale-110"
          aria-label="Next slide"
        >
          <ChevronRight size={28} />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                currentSlide === index
                  ? 'w-10 h-3 bg-white'
                  : 'w-3 h-3 bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

     
    </div>
  );
};

export default FoodDeliveryCarousel;