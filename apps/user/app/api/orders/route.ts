import { NextRequest, NextResponse } from "next/server";
import db from "@workspace/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

async function getCurrentUser() {
  console.log('🔵 [getCurrentUser] Starting...');
  
  try {
    const session = await getServerSession(authOptions);
    console.log('🔵 [getCurrentUser] Session:', JSON.stringify(session, null, 2));
    
    if (!session?.user) {
      console.log('❌ [getCurrentUser] No session or user');
      return null;
    }
    
    console.log('🔵 [getCurrentUser] User role:', session.user.role);
    
    if (session.user.role !== 'CUSTOMER') {
      console.log(`❌ [getCurrentUser] Invalid role: ${session.user.role}`);
      return null;
    }
    
    console.log('✅ [getCurrentUser] User authorized:', session.user.id);
    return session.user;
  } catch (error) {
    console.error('❌ [getCurrentUser] Error:', error);
    return null;
  }
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

function calculateOrderAmounts(items: any[], promoCode?: string) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = 0.05;
  const taxAmount = subtotal * taxRate;
  const deliveryFee = subtotal >= 299 ? 0 : 40;
  const platformFee = subtotal * 0.02;
  
  let discountAmount = 0;
  const promoCodes: Record<string, number> = {
    'SAVE50': 50,
    'FIRST100': 100,
    'WELCOME20': 20,
  };

  if (promoCode && promoCodes[promoCode.toUpperCase()]) {
    discountAmount = promoCodes[promoCode.toUpperCase()];
  }

  const totalAmount = subtotal + taxAmount + deliveryFee + platformFee - discountAmount;

  return {
    subtotal,
    taxAmount,
    deliveryFee,
    platformFee,
    discountAmount,
    totalAmount: Math.max(0, totalAmount),
  };
}

export async function POST(req: NextRequest) {
  console.log('\n🚀 ========== ORDER API CALLED ==========');
  
  try {
    // 1. Get user
    console.log('🔵 Step 1: Authenticating user...');
    const user = await getCurrentUser();
    
    if (!user) {
      console.log('❌ Step 1 FAILED: Unauthorized');
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }
    console.log('✅ Step 1: User authenticated -', user.id);

    // 2. Parse body
    console.log('🔵 Step 2: Parsing request body...');
    const body = await req.json();
    console.log('🔵 Body received:', JSON.stringify(body, null, 2));
    
    const { 
      items, 
      restaurantId, 
      deliveryAddress, 
      specialInstructions,
      promoCode,
      tipAmount = 0,
      deliveryType = 'DELIVERY'
    } = body;

    // 3. Validate items
    console.log('🔵 Step 3: Validating items...');
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log('❌ Step 3 FAILED: Invalid items');
      return NextResponse.json(
        { success: false, message: 'Items are required' },
        { status: 400 }
      );
    }
    console.log('✅ Step 3: Items valid -', items.length, 'items');

    // 4. Validate restaurant
    console.log('🔵 Step 4: Validating restaurant...');
    if (!restaurantId) {
      console.log('❌ Step 4 FAILED: No restaurant ID');
      return NextResponse.json(
        { success: false, message: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId }
    });

    if (!restaurant) {
      console.log('❌ Step 4 FAILED: Restaurant not found');
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }
    console.log('✅ Step 4: Restaurant found -', restaurant.name);

    // 5. Validate menu items
    console.log('🔵 Step 5: Validating menu items...');
    const menuItemIds = items.map(item => item.id);
    console.log('🔵 Looking for menu items:', menuItemIds);
    
    const menuItems = await db.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        restaurantId: restaurantId,
        isAvailable: true
      }
    });

    console.log('🔵 Found', menuItems.length, 'of', items.length, 'items');
    
    if (menuItems.length !== items.length) {
      console.log('❌ Step 5 FAILED: Some items unavailable');
      return NextResponse.json(
        { success: false, message: 'Some items are not available' },
        { status: 400 }
      );
    }
    console.log('✅ Step 5: All menu items valid');

    // 6. Calculate amounts
    console.log('🔵 Step 6: Calculating amounts...');
    const amounts = calculateOrderAmounts(items, promoCode);
    console.log('✅ Step 6: Amounts calculated -', amounts);

    // 7. Generate order number
    const orderNumber = generateOrderNumber();
    console.log('✅ Step 7: Order number -', orderNumber);

    // 8. Create order
    console.log('🔵 Step 8: Creating order in database...');
    
    const orderData = {
      orderNumber,
      userId: user.id,
      restaurantId,
      status: 'PENDING' as any,
      paymentStatus: 'PENDING' as any,
      subtotal: amounts.subtotal,
      taxAmount: amounts.taxAmount,
      deliveryFee: amounts.deliveryFee,
      platformFee: amounts.platformFee,
      discountAmount: amounts.discountAmount,
      tipAmount,
      totalAmount: amounts.totalAmount + tipAmount,
      deliveryType: deliveryType as any,
      deliveryAddress: deliveryAddress || null,
      specialInstructions: specialInstructions || null,
      estimatedDeliveryTime: 30,
    };
    
    console.log('🔵 Order data:', JSON.stringify(orderData, null, 2));

    const order = await db.order.create({
      data: orderData
    });
    
    console.log('✅ Step 8: Order created -', order.id);

    // 9. Create order items
console.log('🔵 Step 9: Creating order items...');

const orderItems = items.map(item => ({
  orderId: order.id,
  menuItemId: item.id,
  quantity: item.quantity,
  unitPrice: item.price,                    // Price per single item
  totalPrice: item.price * item.quantity,   // Total price for this line item
  customizations: item.customizations || null,
}));

console.log('🔵 Order items to create:', JSON.stringify(orderItems, null, 2));

await db.orderItem.createMany({
  data: orderItems
});

console.log('✅ Step 9: Order items created -', orderItems.length);

    // 10. Fetch complete order
    console.log('🔵 Step 10: Fetching complete order...');
    const completeOrder = await db.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        restaurant: {
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        cuisine: true,
        logo: true,
        coverImage: true,
        isPureVeg: true,
        isOpen: true,
        averageRating: true,
        averageCostForTwo: true,
        openingTime: true,
        closingTime: true,
        addresses: true,  // ✅ Use addresses relation
      }
    }
      }
    });

    console.log('✅ Step 10: Complete order fetched');
    console.log('🎉 ========== ORDER SUCCESS ==========\n');

    return NextResponse.json(
      {
        success: true,
        message: 'Order placed successfully!',
        data: completeOrder
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('💥 ========== ORDER ERROR ==========');
    console.error('Error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('========================================\n');
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create order. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const orders = await db.order.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        restaurant: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}