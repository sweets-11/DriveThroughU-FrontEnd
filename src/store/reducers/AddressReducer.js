import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  addresses: [],
  error: false,
  loading: false,
  selectedAdress: null,
};

const slice = createSlice({
  name: 'Address',
  initialState,
  reducers: {
    addAddress: (state, action) => {
      state.loading = true;
    },
    addAddressSucess: state => {
      state.loading = false;
    },
    addAddressError: (state, action) => {
      state.loading = false;
      state.error = action.payload.error;
    },
    deleteAddress: (state, action) => {
      state.loading = true;
    },
    deleteAddressSuccess: (state, action) => {
      state.loading = false;
    },
    deleteAddressFail: (state, action) => {
      state.loading = false;
      state.error = action.payload.error;
    },
    getAddresses: (state, action) => {
      state.loading = true;
    },
    getAddressesSuccess: (state, action) => {
      state.loading = false;
      state.error = false;
      state.addresses = action.payload.addresses;
    },
    getAddressesError: (state, action) => {
      state.loading = false;
      state.error = true;
      state.errorMsg = action.payload.error;
      state.addresses = [];
    },
    storeSelectedAddress: (state, action) => {
      state.selectedAdress = action.payload;
    },
  },
});

export default slice.reducer;
export const {
  addAddress,
  addAddressError,
  addAddressSucess,
  deleteAddress,
  deleteAddressSuccess,
  deleteAddressFail,
  getAddresses,
  getAddressesSuccess,
  getAddressesError,
  storeSelectedAddress,
} = slice.actions;
