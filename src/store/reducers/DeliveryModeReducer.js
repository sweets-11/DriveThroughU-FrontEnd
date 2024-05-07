import {createSlice} from '@reduxjs/toolkit';

export const DRIVER_STATUS = {
  FINDING_DRIVERS: 'FindingDrivers',
  WAITING_FOR_A_DRIVER_TO_ACCEPT: 'WaitingForADriverToAccept',
  TRIP_ACCEPTED: 'TripAccepted',
  GOING_TO_PICKUP_LOCATION: 'GoingToPickupLocation',
  REACHED_PICKUP_LOCATION: 'ReachedPickupLocation',
  RIDE_STARTED: 'RideStarted',
  PICKING_ITEMS: 'PickingItems',
  WAITING_FOR_USER_PAYMENT: 'WaitingForUserPayment',
  GOING_TO_DELIVERY_LOCATION: 'GoingToDeliveryLocation',
  REACHED_DELIVERY_LOCATION: 'ReachedDeliveryLocation',
  DELIVERED: 'Delivered',
  RIDE_COMPLETED: 'RideCompleted',
  OPEN_FOR_TRIPS: 'OpenForTrips',
};

export const DRIVER_STATUS_CODE = {
  [DRIVER_STATUS.FINDING_DRIVERS]: 0,
  [DRIVER_STATUS.WAITING_FOR_A_DRIVER_TO_ACCEPT]: 100,
  [DRIVER_STATUS.TRIP_ACCEPTED]: 200,
  [DRIVER_STATUS.GOING_TO_PICKUP_LOCATION]: 300,
  [DRIVER_STATUS.REACHED_PICKUP_LOCATION]: 400,
  [DRIVER_STATUS.RIDE_STARTED]: 450,
  [DRIVER_STATUS.PICKING_ITEMS]: 500,
  [DRIVER_STATUS.WAITING_FOR_USER_PAYMENT]: 600,
  [DRIVER_STATUS.GOING_TO_DELIVERY_LOCATION]: 700,
  [DRIVER_STATUS.REACHED_DELIVERY_LOCATION]: 800,
  [DRIVER_STATUS.DELIVERED]: 900,
  [DRIVER_STATUS.RIDE_COMPLETED]: 950,
  [DRIVER_STATUS.OPEN_FOR_TRIPS]: 1000,
};

const initialState = {
  deliveryMode: false,
  deliveryModeLoading: false,
  driverStatus: DRIVER_STATUS.OPEN_FOR_TRIPS,
  isOnboarded: false,
  location: {
    latitude: 0,
    longitude: 0,
  },
  pastTrips: [],
  pastTripsLoading: false,
  trips: [],
  tripsLoading: false,
  error: null,
  trip: null,
};

const slice = createSlice({
  name: 'DeliveryMode',
  initialState,
  reducers: {
    switchDeliveryMode: (state, action) => {
      state.deliveryMode = action.payload.deliveryMode;
    },
    setDeliveryModeLoading: (state, action) => {
      state.deliveryModeLoading = action.payload.deliveryModeLoading;
    },
    setOnBoardingStatus: (state, action) => {
      state.isOnboarded = action.payload.isOnboarded;
    },
    fetchDeliveryTrips: (state, action) => {
      state.tripsLoading = true;
    },
    fetchDeliveryTripsSuccess: (state, action) => {
      state.tripsLoading = false;
      state.trips = action.payload.trips.map(trip => {
        return {
          ...trip,
          newTrip:
            state.trips.findIndex(oldTrip => oldTrip._id === trip._id) === -1,
        };
      });
    },
    fetchDeliveryTripsFailure: (state, action) => {
      state.tripsLoading = false;
      state.error = action.payload.error;
      state.trips = [{noTrips: true}];
    },
    setDriverStatus: (state, action) => {
      state.driverStatus = action.payload.driverStatus;
    },
    fetchPastTrips: (state, action) => {
      state.pastTripsLoading = true;
    },
    fetchPastTripsSucess: (state, action) => {
      state.pastTrips = action.payload.pastTrips;
      state.pastTripsLoading = false;
    },
    fetchPastTripsFail: (state, action) => {
      state.pastTripsLoading = false;
      state.error = action.payload.error;
    },
    resetDeliveryModeState: (state, action) => {
      return {...state, trips: [], driverStatus: DRIVER_STATUS.OPEN_FOR_TRIPS};
    },
    updateLocation: (state, action) => {
      state.location = action.payload.location;
    },
    updateDeliveryTrip: (state, action) => {
      state.trip = action.payload.trip;
    },
  },
});

export default slice.reducer;
export const {
  fetchDeliveryTrips,
  fetchDeliveryTripsFailure,
  fetchDeliveryTripsSuccess,
  fetchPastTrips,
  fetchPastTripsFail,
  fetchPastTripsSucess,
  resetDeliveryModeState,
  setDeliveryModeLoading,
  setOnBoardingStatus,
  switchDeliveryMode,
  setDriverStatus,
  updateLocation,
  updateDeliveryTrip,
} = slice.actions;
