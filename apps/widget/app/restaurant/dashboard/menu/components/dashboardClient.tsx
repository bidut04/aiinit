'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, MoreVertical, Search, Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Badge } from '@workspace/ui/components/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@workspace/ui/components/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { Label } from '@workspace/ui/components/label'
import { Textarea } from '@workspace/ui/components/textarea'
import { Switch } from '@workspace/ui/components/switch'
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from '@workspace/ui/components/select'
import { useRestaurant } from '@/app/restaurant/context/restaurant-context'

export default function RestaurantMenuTable() {
  const { restaurantId, loading: contextLoading } = useRestaurant()
  
  // Data states
  const [categories, setCategories] = useState([])
  const [expandedCategories, setExpandedCategories] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Dialog states
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showItemDialog, setShowItemDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  
  // Category form states
  const [categoryName, setCategoryName] = useState('')
  
  // Item form states - Basic
  const [itemName, setItemName] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [itemPrice, setItemPrice] = useState('')
  const [discountPrice, setDiscountPrice] = useState('')
  const [isAvailable, setisAvailable] = useState(true)
  const [isVeg, setisVeg] = useState(true)
  
  // Item form states - Additional
  const [calories, setCalories] = useState('')
  const [spiceLevel, setSpiceLevel] = useState('')
  const [prepTime, setPrepTime] = useState('')
  const [servingSize, setServingSize] = useState('')
  const [tags, setTags] = useState('')
  const [isBestseller, setIsBestseller] = useState(false)
  const [isRecommended, setIsRecommended] = useState(false)
  
  // Image upload states
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      if (!restaurantId) return
      
      try {
        setLoading(true)
        const response = await fetch(`/api/resturant/${restaurantId}/categories`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: "include"
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to fetch categories')
        }

        const data = await response.json()
        console.log('Fetched categories:', data)
        
        setCategories(data)
        
        // Expand all categories by default
        if (data && data.length > 0) {
          setExpandedCategories(new Set(data.map(cat => cat.id)))
        }

      } catch (error) {
        console.error('Error fetching categories:', error)
        alert('Failed to load categories')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [restaurantId])

  const toggleCategory = (categoryId) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) {
      alert("Please enter a category name")
      return
    }

    try {
      const response = await fetch(`/api/resturant/${restaurantId}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          name: categoryName
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create category')
      }

      const newCategory = await response.json()
      console.log('Category created:', newCategory)
      
      // Add new category to state
      setCategories([...categories, newCategory])
      
      // Reset and close dialog
      setCategoryName('')
      setShowCategoryDialog(false)
      
      alert('Category created successfully!')

    } catch (error) {
      console.error('Error creating category:', error)
      alert(error.message || 'Failed to create category')
    }
  }

  const resetItemForm = () => {
    setItemName('')
    setItemDescription('')
    setItemPrice('')
    setDiscountPrice('')
    setisAvailable(true)
    setisVeg(true)
    setCalories('')
    setSpiceLevel('')
    setPrepTime('')
    setServingSize('')
    setTags('')
    setIsBestseller(false)
    setIsRecommended(false)
    setSelectedImage(null)
    setImagePreview(null)
  }

  const openAddItemDialog = (categoryId) => {
    setSelectedCategory(categoryId)
    resetItemForm()
    setShowItemDialog(true)
  }

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }

      setSelectedImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'restaurants/menu-items')

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      return result.secureUrl
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  const handleAddItem = async () => {
    if (!itemName.trim() || !itemPrice || !selectedCategory) {
      alert('Please fill in all required fields (Name and Price)')
      return
    }

    try {
      setUploadingImage(true)
      
      // Upload image if selected
      let imageUrl = null
      if (selectedImage) {
        imageUrl = await uploadImageToCloudinary(selectedImage)
      }

      // Prepare request body matching backend structure
      const requestBody = {
        categoryId: selectedCategory,
        name: itemName,
        description: itemDescription || null,
        imageUrl: imageUrl,
        price: itemPrice,
        discountPrice: discountPrice || null,
        isVeg: isVeg,
        isAvailable: isAvailable,
        isBestseller: isBestseller,
        isRecommended: isRecommended,
        calories: calories || null,
        spiceLevel: spiceLevel || null,
        prepTime: prepTime || null,
        servingSize: servingSize || null,
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        sortOrder: 0
      }

      console.log('Creating menu item:', requestBody)

      const response = await fetch(
        `/api/resturant/${restaurantId}/categories/${selectedCategory}/menuItem`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(requestBody),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create menu item')
      }

      const newItem = await response.json()
      console.log('Menu item created:', newItem)
      
      // Update categories state with new item
      setCategories(categories.map(cat => 
        cat.id === selectedCategory 
          ? { ...cat, menuItems: [...(cat.menuItems || []), newItem] }
          : cat
      ))
      
      // Reset and close
      resetItemForm()
      setShowItemDialog(false)
      setSelectedCategory(null)
      
      alert('Menu item added successfully!')

    } catch (error) {
      console.error('Error adding item:', error)
      alert(error.message || 'Failed to add item. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const filteredCategories = categories.map(category => ({
    ...category,
    menuItems: (category.menuItems || []).filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => 
    searchQuery === '' || category.menuItems.length > 0
  )

  // Loading state
  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
            <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Category</DialogTitle>
                  <DialogDescription>
                    Add a new category to organize your menu items.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category-name">Category Name</Label>
                    <Input
                      id="category-name"
                      placeholder="e.g., Appetizers, Main Course"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCategory}>Create Category</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Main Content - Table */}
      <div className="p-6">
        <div className="bg-white rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] text-black"></TableHead>
                <TableHead className="w-[80px] text-black">Image</TableHead>
                <TableHead  className='text-black'>Item Name</TableHead>
                <TableHead className='text-black'>Description</TableHead>
                <TableHead className="w-[100px] text-black">Type</TableHead>
                <TableHead className="w-[120px] text-black">Price</TableHead>
                <TableHead className="w-[100px] text-black">Status</TableHead>
                <TableHead className="w-[80px] text-black">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => {
                const isExpanded = expandedCategories.has(category.id)
                
                return (
                  <React.Fragment key={category.id}>
                    {/* Category Row */}
                    <TableRow className="bg-gray-50 hover:bg-gray-100 text-black">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCategory(category.id)}
                          className="h-8 w-8 p-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell colSpan={6}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-base text-black">{category.name}</span>
                            <Badge variant="secondary" className=''>{category.menuItems?.length || 0} items</Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAddItemDialog(category.id)}
                          >
                            <Plus className="mr-2 h-3 w-3" />
                            Add Item
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit Category
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Category
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>

                    {/* Menu Items Rows */}
                    {isExpanded && category.menuItems?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell></TableCell>
                        <TableCell>
                          {item.imageUrl || item.image ? (
                            <img 
                              src={item.imageUrl || item.image} 
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-black">{item.name}</TableCell>
                        <TableCell className="text-gray-600 text-sm text-black">
                          {item.description}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={item.veg || item.isVeg ? "default" : "secondary"} 
                            className={item.veg || item.isVeg ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-800 hover:bg-red-100"}
                          >
                            {item.veg || item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-black">
                          ${parseFloat(item.price).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.available || item.isAvailable ? "default" : "secondary"}>
                            {item.available || item.isAvailable ? 'Available' : 'Unavailable'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit Item
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                Toggle Availability
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Item
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Empty State for Category */}
                    {isExpanded && (!category.menuItems || category.menuItems.length === 0) && (
                      <TableRow>
                        <TableCell></TableCell>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          <p>No items in this category.</p>
                          <Button
                            variant="link"
                            onClick={() => openAddItemDialog(category.id)}
                            className="mt-2"
                          >
                            Add your first item
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })}

              {/* Global Empty State */}
              {filteredCategories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <p className="text-gray-500">
                      {searchQuery ? 'No items found matching your search.' : 'No categories yet. Create your first category to get started.'}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Menu Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto text-black">
          <DialogHeader>
            <DialogTitle >Add Menu Item</DialogTitle>
            <DialogDescription>
              Add a new item to the selected category.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Image Upload Section */}
            <div className="grid gap-2">
              <Label>Item Image</Label>
              <div className=" text-black border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 text-black"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600 mb-1">Click to upload image</span>
                    <span className="text-xs text-gray-500">PNG, JPG, WEBP up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="item-name">Item Name *</Label>
                <Input
                  id="item-name"
                  placeholder="e.g., Grilled Chicken"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="item-description">Description</Label>
                <Textarea
                  id="item-description"
                  placeholder="Brief description of the item"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="item-price">Price ($) *</Label>
                <Input
                  id="item-price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="discount-price">Discount Price ($)</Label>
                <Input
                  id="discount-price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  placeholder="e.g., 250"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="spice-level">Spice Level</Label>
                <Select value={spiceLevel} onValueChange={setSpiceLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MILD">Mild</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HOT">Hot</SelectItem>
                    <SelectItem value="EXTRA_HOT">Extra Hot</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="prep-time">Prep Time (minutes)</Label>
                <Input
                  id="prep-time"
                  type="number"
                  placeholder="e.g., 15"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="serving-size">Serving Size</Label>
                <Input
                  id="serving-size"
                  placeholder="e.g., 1 person, 2-3 people"
                  value={servingSize}
                  onChange={(e) => setServingSize(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="e.g., spicy, chef special, new"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center justify-between border rounded-lg p-3">
                <Label htmlFor="item-veg">Vegetarian</Label>
                <Switch
                  id="item-veg"
                  checked={isVeg}
                  onCheckedChange={setisVeg}
                />
              </div>

              <div className="flex items-center justify-between border rounded-lg p-3">
                <Label htmlFor="item-available">Available</Label>
                <Switch
                  id="item-available"
                  checked={isAvailable}
                  onCheckedChange={setisAvailable}
                />
              </div>

              <div className="flex items-center justify-between border rounded-lg p-3">
                <Label htmlFor="bestseller">Bestseller</Label>
                <Switch
                  id="bestseller"
                  checked={isBestseller}
                  onCheckedChange={setIsBestseller}
                />
              </div>

              <div className="flex items-center justify-between border rounded-lg p-3">
                <Label htmlFor="recommended">Recommended</Label>
                <Switch
                  id="recommended"
                  checked={isRecommended}
                  onCheckedChange={setIsRecommended}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowItemDialog(false)
                resetItemForm()
              }}
              disabled={uploadingImage}
            >
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={uploadingImage}>
              {uploadingImage ? 'Adding...' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}