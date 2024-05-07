import {createSelector} from 'reselect';

export const getUserData = createSelector(
  state => state.User,
  user => user,
);

export const getPastOrdersLoading = createSelector(
  state => state.User,
  user => user.pastOrdersLoading,
);
export const getPastOrders = createSelector(
  state => state.User,
  user => user.pastOrders,
);
