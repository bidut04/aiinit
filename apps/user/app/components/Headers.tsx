'use client'
import React, { useState } from 'react';
import { Search, ShoppingCart, User, Menu, X, MapPin, Clock } from 'lucide-react';
import { CartButton } from './CartButton';

export default function FoodAppHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(3);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span className="hidden sm:inline">Deliver to: </span>
              <span className="font-semibold">Mumbai 400001</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span className="hidden sm:inline">Delivery in 30 mins</span>
            <span className="sm:hidden">30 mins</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent hidden sm:block">
              Fosty
            </h1>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="search"
                placeholder="Search for restaurants, cuisines, or dishes..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-4">
            {/* Desktop Menu */}
            <nav className="hidden lg:flex items-center gap-6">
              <a href="#" className="text-gray-700 hover:text-orange-500 transition-colors font-medium">
                Home
              </a>
              <a href="#" className="text-gray-700 hover:text-orange-500 transition-colors font-medium">
                Menu
              </a>
              <a href="#" className="text-gray-700 hover:text-orange-500 transition-colors font-medium">
                Offers
              </a>
            </nav>

            {/* Cart */}
            {/* <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ShoppingCart className="text-gray-700" size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button> */}
            <CartButton/>

            {/* User Account */}
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <User size={20} className="text-gray-700" />
              <span className="font-medium text-gray-700 hidden lg:inline">Account</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="mt-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="search"
              placeholder="Search food..."
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3">
            <a href="#" className="px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-500 rounded-lg transition-colors font-medium">
              Home
            </a>
            <a href="#" className="px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-500 rounded-lg transition-colors font-medium">
              Menu
            </a>
            <a href="#" className="px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-500 rounded-lg transition-colors font-medium">
              Offers
            </a>
            <a href="#" className="px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-500 rounded-lg transition-colors font-medium sm:hidden">
              My Account
            </a>
            <a href="#" className="px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-500 rounded-lg transition-colors font-medium">
              Help & Support
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}