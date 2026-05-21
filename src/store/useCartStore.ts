import { create } from 'zustand';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  cartActive: boolean;
  setCartActive: (active: boolean) => void;
  addItem: (product: { id: number; name: string; price: number; image_url: string }) => void;
  removeItem: (id: number) => void;
  decrementItem: (id: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  cartActive: false,
  
  setCartActive: (active: boolean) => set({ cartActive: active }),
  
  addItem: (product) => {
    const currentItems = get().items;
    const existingItem = currentItems.find(item => item.id === product.id);
    
    if (existingItem) {
      set({
        items: currentItems.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        )
      });
    } else {
      set({ items: [...currentItems, { ...product, quantity: 1 }] });
    }
  },
  
  removeItem: (id) => {
    set({ items: get().items.filter(item => item.id !== id) });
  },
  
  decrementItem: (id) => {
    const currentItems = get().items;
    const existingItem = currentItems.find(item => item.id === id);
    if (!existingItem) return;
    
    if (existingItem.quantity === 1) {
      set({ items: currentItems.filter(item => item.id !== id) });
    } else {
      set({
        items: currentItems.map(item =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
      });
    }
  },
  
  clearCart: () => set({ items: [] }),
  
  getCartTotal: () => {
    return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}));
