import {createSelector} from 'reselect';

export const getFindDriverLoading = createSelector(
  state => state.Driver,
  address => address.loading,
);
export const getDriverInfo = createSelector(
  state => state.Driver,
  driver => driver.driverInfo,
);

export const getDrivers = createSelector(
  state => state.Driver,
  driver => driver.drivers,
);

export const getDeliveryStatus = createSelector(
  state => state.Driver,
  driver => driver.deliveryStatus,
);

export const getTrip = createSelector(
  state => state.Driver,
  driver => driver.trip,
);
