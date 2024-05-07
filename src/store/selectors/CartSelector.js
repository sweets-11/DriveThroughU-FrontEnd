import {createSelector} from 'reselect';

export const getCartItems = createSelector(
  state => state.Cart,
  cart => cart.cartItems,
);
