/// <reference types="astro/client" />

import type {
  addToCart,
  getCart,
  removeCartLine,
  updateCartLine,
  updateCartNote,
} from '@/lib/storefrontCart';

import type {
  addWishlistItem,
  clearWishlist,
  getWishlist,
  isWishlisted,
  removeWishlistItem,
  setWishlist,
  toggleWishlistItem,
} from '@/lib/wishlist';

declare global {
  interface Window {
    RivaCart: {
      addToCart: typeof addToCart;
      getCart: typeof getCart;
      removeCartLine: typeof removeCartLine;
      updateCartLine: typeof updateCartLine;
      updateCartNote: typeof updateCartNote;
    };
    RivaWishlist: {
      addWishlistItem: typeof addWishlistItem;
      clearWishlist: typeof clearWishlist;
      getWishlist: typeof getWishlist;
      isWishlisted: typeof isWishlisted;
      removeWishlistItem: typeof removeWishlistItem;
      setWishlist: typeof setWishlist;
      toggleWishlistItem: typeof toggleWishlistItem;
    };
    RivaCartReady: Promise<Window['RivaCart']>;
    RivaWishlistReady: Promise<Window['RivaWishlist']>;
    __resolveRivaCart: (cart: Window['RivaCart']) => void;
    __resolveRivaWishlist: (wishlist: Window['RivaWishlist']) => void;
  }
}
