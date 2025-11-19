// Guest cart management using localStorage
const GUEST_CART_KEY = 'artroyal_guest_cart';

export const getGuestCart = () => {
  if (typeof window === 'undefined') return [];
  const cart = localStorage.getItem(GUEST_CART_KEY);
  return cart ? JSON.parse(cart) : [];
};

export const addToGuestCart = (product, quantity = 1) => {
  const cart = getGuestCart();
  const existingIndex = cart.findIndex(item => item.product_id === product.id);
  
  if (existingIndex >= 0) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({
      product_id: product.id,
      product_name: product.name,
      quantity,
      price: product.price,
      product_image: product.images?.[0]
    });
  }
  
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  return cart;
};

export const updateGuestCartItem = (productId, quantity) => {
  const cart = getGuestCart();
  const index = cart.findIndex(item => item.product_id === productId);
  
  if (index >= 0) {
    if (quantity <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity = quantity;
    }
  }
  
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  return cart;
};

export const removeFromGuestCart = (productId) => {
  const cart = getGuestCart().filter(item => item.product_id !== productId);
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  return cart;
};

export const clearGuestCart = () => {
  localStorage.removeItem(GUEST_CART_KEY);
  return [];
};

export const migrateGuestCartToUser = async (base44, userId) => {
  const guestCart = getGuestCart();
  
  for (const item of guestCart) {
    const existingItems = await base44.entities.CartItem.filter({
      user_id: userId,
      product_id: item.product_id
    });
    
    if (existingItems.length > 0) {
      await base44.entities.CartItem.update(existingItems[0].id, {
        quantity: existingItems[0].quantity + item.quantity
      });
    } else {
      await base44.entities.CartItem.create({
        user_id: userId,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      });
    }
  }
  
  clearGuestCart();
};