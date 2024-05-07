import {createSlice} from '@reduxjs/toolkit';

const initialState = {cartItems: []};

const slice = createSlice({
  name: 'CartItems',
  initialState,
  reducers: {
    addItem: (state, action) => {
      state.cartItems.push(action.payload.item);
    },
    changeItemInfo: (state, action) => {
      state.cartItems[action.payload.index].item = action.payload.item;
      state.cartItems[action.payload.index].quantity = action.payload.quantity;
    },
    deleteCartItem: (state, action) => {
      state.cartItems.splice(action.payload.index, 1);
    },
  },
});

export default slice.reducer;
export const {addItem, changeItemInfo, deleteCartItem} = slice.actions;
