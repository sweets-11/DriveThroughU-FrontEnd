import axios from 'axios';
import {getToken} from '../../utils/storage';
import {AUTH_TOKEN} from '../../utils/otpFunctions';
import {AWS_BASE_URL} from '@env';
import {getDirections} from '../../utils/mapUtils';

const {
  fetchDeliveryTrips,
  fetchDeliveryTripsSuccess,
  fetchDeliveryTripsFailure,
  setDriverStatus,
  fetchPastTrips,
  fetchPastTripsSucess,
  fetchPastTripsFail,
  DRIVER_STATUS_CODE,
  updateLocation,
  DRIVER_STATUS,
  updateDeliveryTrip,
  switchDeliveryMode,
  setDeliveryModeLoading,
} = require('../reducers/DeliveryModeReducer');

export const deliveryModeMidleware =
  ({dispatch}) =>
  next =>
  action => {
    if (action.type === fetchDeliveryTrips.type) {
      next(action);
      getToken(AUTH_TOKEN)
        .then(token => {
          axios
            .post(
              `${AWS_BASE_URL}/getAllTrips`,
              {
                pickup_Location: action.payload.location,
              },
              {
                headers: {
                  authorization: `Bearer ${token}`,
                },
              },
            )
            .then(response => {
              let trips = response.data.data;
              if (trips && trips.length) {
                dispatch(fetchDeliveryTripsSuccess({trips}));
              } else {
                dispatch(
                  fetchDeliveryTripsFailure({error: 'No trips received'}),
                );
              }
            })
            .catch(error => {
              dispatch(fetchDeliveryTripsFailure({error: error.message}));
            });
        })
        .catch(error => {
          dispatch(fetchDeliveryTripsFailure({error}));
        });
    } else if (action.type === setDriverStatus.type) {
      next(action);
      getToken(AUTH_TOKEN)
        .then(token => {
          axios
            .post(
              `${AWS_BASE_URL}/updateTripStatus`,
              {
                amount: action.payload.amount,
                location: action.payload.location,
                num:
                  DRIVER_STATUS_CODE[action.payload.driverStatus] ||
                  DRIVER_STATUS_CODE[DRIVER_STATUS.DELIVERED],
                tip: 0,
                trip_id: action.payload.tripId,
              },
              {
                headers: {
                  authorization: `Bearer ${token}`,
                },
              },
            )
            .then(response => {
              console.log('Updated trip status: ', response.data);
              dispatch(updateDeliveryTrip({trip: response.data.trip}));
            })
            .catch(error => {
              console.log('Error in udpating trip status: ', error.message);
            });
        })
        .catch(error => {
          console.log('Error in fetching token: ', error);
        });
    } else if (action.type === fetchPastTrips.type) {
      next(action);
      getToken(AUTH_TOKEN).then(token => {
        axios
          .post(
            `${AWS_BASE_URL}/getDriverPastTrips`,
            {},
            {
              headers: {
                authorization: `Bearer ${token}`,
              },
            },
          )
          .then(response => {
            console.log('Past trips: ', response.data);
            dispatch(
              fetchPastTripsSucess({
                pastTrips: response.data.past_trips?.sort(
                  (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
                ),
              }),
            );
          })
          .catch(error => {
            console.log('Past trips fetch fail: ', error.message);
            dispatch(fetchPastTripsFail({error: error.message}));
          });
      });
    } else if (action.type === updateLocation.type) {
      next(action);
      getToken(AUTH_TOKEN).then(token => {
        axios
          .post(
            `${AWS_BASE_URL}/driverUpdateLocation`,
            {location: action.payload.location},
            {
              headers: {
                authorization: `Bearer ${token}`,
              },
            },
          )
          .then(response => {
            console.log('Update location success: ', response.data);
          })
          .catch(error => {
            console.log('Update location fail: ', error.message);
          });
      });
    } else if (action.type === switchDeliveryMode.type) {
      getToken(AUTH_TOKEN).then(token => {
        axios
          .post(
            `${AWS_BASE_URL}/updateDriverStatus`,
            {driverStatus: action.payload.deliveryMode},
            {
              headers: {
                authorization: `Bearer ${token}`,
              },
            },
          )
          .then(response => {
            console.log('Driver mode switch success: ', response.data);
            dispatch(setDeliveryModeLoading({deliveryModeLoading: false}));
            next(action);
          })
          .catch(error => {
            console.log('Driver mode switch fail: ', error.message);
            dispatch(setDeliveryModeLoading({deliveryModeLoading: false}));
            next(action);
          });
      });
    } else {
      return next(action);
    }
  };
