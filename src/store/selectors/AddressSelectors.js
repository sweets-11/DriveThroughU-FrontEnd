import {createSelector} from 'reselect';

export const getAddressLoading = createSelector(
  state => state.Addresses,
  address => address.loading,
);
export const getAddresses = createSelector(
  state => state.Addresses,
  address => address.addresses,
);

export const getSelectedAddress = createSelector(
  state => state.Addresses,
  address => address.selectedAdress,
);
