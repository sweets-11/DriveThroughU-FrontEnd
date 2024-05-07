import {createSelector} from 'reselect';

export const getDailyPayouts = createSelector(
  state => state.DriverPayment,
  driverPayment => driverPayment.dailyPayOuts,
);
export const getTransfers = createSelector(
  state => state.DriverPayment,
  driverPayment => driverPayment.transfers,
);
