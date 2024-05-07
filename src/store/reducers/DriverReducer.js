//UserPerspective

import {createSlice} from '@reduxjs/toolkit';
import {DRIVER_STATUS} from './DeliveryModeReducer';

const initialState = {
  driverInfo: null,
  drivers: [],
  error: false,
  loading: false,
  deliveryStatus: '',
  trip: null,
};

const slice = createSlice({
  name: 'Driver',
  initialState,
  reducers: {
    driverAcceptedTrip: (state, action) => {
      state.driverInfo = action.payload.driverInfo;
      if (action.payload.shouldUpdateTripStatus) {
        state.deliveryStatus = DRIVER_STATUS.GOING_TO_PICKUP_LOCATION;
      }
    },
    driverStartingDelivery: (state, action) => {
      state.deliveryStatus = DRIVER_STATUS.GOING_TO_DELIVERY_LOCATION;
    },
    findDriver: (state, action) => {
      state.loading = true;
      state.deliveryStatus = DRIVER_STATUS.FINDING_DRIVERS;
    },
    findDriversSuccess: (state, action) => {
      state.loading = false;
      state.error = false;
      state.drivers = action.payload.drivers;
      state.deliveryStatus = DRIVER_STATUS.WAITING_FOR_A_DRIVER_TO_ACCEPT;
      state.trip = action.payload.trip;
    },
    findDriverError: (state, action) => {
      state.loading = false;
      state.error = true;
      state.errorMsg = action.payload.error;
      state.addresses = [];
      state.deliveryStatus = '';
    },
    getTripStatus: (state, action) => {
      state.loading = true;
    },
    resetState: (state, action) => {
      return initialState;
    },
    updateDriverLocation: (state, action) => {
      const location = action.payload.location;
      state.driverInfo.currentLocation.coordinates = [
        location.longitude,
        location.latitude,
      ];
    },

    updateDeliveryStatus: (state, action) => {
      state.deliveryStatus = action.payload.deliveryStatus;
    },
    updateTrip: (state, action) => {
      state.trip = action.payload.trip;
      state.loading = false;
      state.deliveryStatus = action.payload.trip?.tripStatus;
    },
  },
});

export default slice.reducer;
export const {
  driverAcceptedTrip,
  driverStartingDelivery,
  findDriver,
  findDriversSuccess,
  findDriverError,
  getTripStatus,
  resetState,
  updateDriverLocation,
  updateDeliveryStatus,
  updateTrip,
} = slice.actions;
