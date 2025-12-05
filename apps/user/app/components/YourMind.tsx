
import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function WhatsOnYourMind() {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const categories = [
    { id: 1, name: 'Pizza', emoji: '🍕', color: 'from-red-400 to-orange-500' },
    { id: 2, name: 'Burger', emoji: '🍔', color: 'from-yellow-400 to-orange-500' },
    { id: 3, name: 'Biryani', emoji: '🍛', color: 'from-orange-400 to-red-500' },
    { id: 4, name: 'Chinese', emoji: '🥡', color: 'from-red-500 to-pink-500' },
    { id: 5, name: 'Cake', emoji: '🍰', color: 'from-pink-400 to-purple-500' },
    { id: 6, name: 'Rolls', emoji: '🌯', color: 'from-yellow-500 to-orange-600' },
    { id: 7, name: 'Dosa', emoji: '🥞', color: 'from-green-400 to-teal-500' },
    { id: 8, name: 'Noodles', emoji: '🍜', color: 'from-orange-500 to-red-600' },
    { id: 9, name: 'Momos', emoji: '🥟', color: 'from-blue-400 to-purple-500' },
    { id: 10, name: 'Pasta', emoji: '🍝', color: 'from-yellow-400 to-red-500' },
    { id: 11, name: 'Sandwich', emoji: '🥪', color: 'from-green-500 to-yellow-500' },
    { id: 12, name: 'Ice Cream', emoji: '🍦', color: 'from-pink-500 to-purple-600' },
    { id: 13, name: 'Salad', emoji: '🥗', color: 'from-green-400 to-lime-500' },
    { id: 14, name: 'Thali', emoji: '🍱', color: 'from-orange-500 to-yellow-500' },
    { id: 15, name: 'Kebab', emoji: '�串', color: 'from-red-600 to-orange-600' },
  ];

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 300;
      const newScrollLeft = direction === 'left' 
        ? container.scrollLeft - scrollAmount 
        : container.scrollLeft + scrollAmount;
      
      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setShowLeftArrow(container.scrollLeft > 0);
      setShowRightArrow(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  return (
    <div className="bg-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            What's on your mind?
          </h2>
          <p className="text-gray-600">Explore cuisines and dishes you love</p>
        </div>

        {/* Scrollable Categories */}
        <div className="relative">
          {/* Left Arrow */}
          {showLeftArrow && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all"
              aria-label="Scroll left"
            >
              <ChevronLeft size={24} className="text-gray-700" />
            </button>
          )}

          {/* Categories Container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-2 py-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex-shrink-0 cursor-pointer group"
                onClick={() => console.log(`Selected: ${category.name}`)}
              >
                <div className="relative">
                  {/* Category Card */}
                  <div className={`w-32 h-32 rounded-2xl bg-gradient-to-br ${category.color} shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300 flex items-center justify-center relative overflow-hidden`}>
                    {/* Decorative Circle */}
                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-white opacity-10 rounded-full"></div>
                    <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white opacity-10 rounded-full"></div>
                    
                    {/* Emoji */}
                    <span className="text-6xl group-hover:scale-110 transition-transform duration-300">
                      {category.emoji}
                    </span>
                  </div>

                  {/* Category Name */}
                  <div className="mt-3 text-center">
                    <p className="font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                      {category.name}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          {showRightArrow && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all"
              aria-label="Scroll right"
            >
              <ChevronRight size={24} className="text-gray-700" />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="mt-8 border-t border-gray-200"></div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}