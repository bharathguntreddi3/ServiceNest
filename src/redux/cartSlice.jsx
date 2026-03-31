import { createSlice } from "@reduxjs/toolkit";

// Check local storage for existing cart items when the app first loads
const savedCartItems = JSON.parse(localStorage.getItem("cartItems")) || [];

const cartSlice = createSlice({
  name: "cart",

  initialState: {
    items: savedCartItems,
  },
  reducers: {
    /*************  ✨ Windsurf Command ⭐  *************/
    /**
     * Adds a new item to the cart.
     * @param {object} action.payload - The item to be added to the cart.
     * @example
     * dispatch(addToCart({
     *   id: 1,
     *   name: "Item 1",
     *   price: 10
     * }))
     /*******  6afa4933-9cad-41ea-ad13-f8ea8d89aa27  *******/
    addToCart: (state, action) => {
      state.items.push(action.payload);
      localStorage.setItem("cartItems", JSON.stringify(state.items));
    },

    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      localStorage.setItem("cartItems", JSON.stringify(state.items));
    },

    clearCart: (state) => {
      state.items = [];
      localStorage.setItem("cartItems", JSON.stringify(state.items));
    },

    setCart: (state, action) => {
      state.items = action.payload;
      localStorage.setItem("cartItems", JSON.stringify(state.items));
    },
  },
});

export const { addToCart, removeFromCart, clearCart, setCart } =
  cartSlice.actions;

export default cartSlice.reducer;
