import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  dob: '',
  email: '',
  firstName: '',
  isDeliveryAgent: '',
  isUberDriver: false,
  lastName: '',
  mobileNumber: '',
  pastOrders: [],
  pastOrdersLoading: false,
  stripeInfo: {
    stripeConnectedId: '',
    stripeCustomerId: '',
    stripeOnBoardingStatus: false,
  },
  vehicleType: undefined,
  verified: false,
  _id: '',
};

const slice = createSlice({
  name: 'User',
  initialState,
  reducers: {
    setUserData: (state, action) => {
      return {
        ...action.payload,
        pastOrders: state.pastOrders,
        pastOrdersLoading: state.pastOrdersLoading,
      };
    },
    fetchPastOrders: (state, action) => {
      state.pastOrdersLoading = true;
    },
    fetchPastOrdersSucess: (state, action) => {
      state.pastOrders = action.payload.pastOrders;
      state.pastOrdersLoading = false;
    },
    fetchPastOrdersFail: (state, action) => {
      state.pastOrdersLoading = false;
      state.error = action.payload.error;
    },
  },
});

export default slice.reducer;
export const {
  fetchPastOrders,
  fetchPastOrdersSucess,
  fetchPastOrdersFail,
  setUserData,
} = slice.actions;
