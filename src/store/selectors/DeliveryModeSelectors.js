import {createSelector} from 'reselect';

export const getDeliveryMode = createSelector(
  state => state.DeliveryMode,
  deliveryMode => deliveryMode.deliveryMode,
);

export const getDeliveryModeLoading = createSelector(
  state => state.DeliveryMode,
  deliveryMode => deliveryMode.deliveryModeLoading,
);
export const getIsOnBoarded = createSelector(
  state => state.DeliveryMode,
  deliveryMode => deliveryMode.isOnboarded,
);

export const getDeliveryTrips = createSelector(
  state => state.DeliveryMode,
  deliveryMode => deliveryMode.trips,
);

export const getDeliveryTripsLoading = createSelector(
  state => state.DeliveryMode,
  deliveryMode => deliveryMode.tripsLoading,
);

export const getDriverStatus = createSelector(
  state => state.DeliveryMode,
  deliveryMode => deliveryMode.driverStatus,
);
export const getPastTripsLoading = createSelector(
  state => state.DeliveryMode,
  deliveryMode => deliveryMode.pastTripsLoading,
);
export const getPastTrips = createSelector(
  state => state.DeliveryMode,
  deliveryMode => deliveryMode.pastTrips,
);

export const getLocation = createSelector(
  state => state.DeliveryMode,
  deliveryMode => deliveryMode.location,
);

export const getDeliveryTripStatus = createSelector(
  state => state.DeliveryMode,
  deliveryMode => deliveryMode.trip,
);
