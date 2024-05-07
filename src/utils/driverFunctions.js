import axios from 'axios';
import {getToken} from './storage';
import {AUTH_TOKEN} from './otpFunctions';
import {
  driverAcceptedTrip,
  driverStartingDelivery,
  updateDriverLocation,
} from '../store/reducers/DriverReducer';
import {AWS_BASE_URL} from '@env';
import {getDistanceFromLatLonInKm} from './mapUtils';

export const didDriverAccept = ({shouldUpdateTripStatus, store, tripId}) => {
  console.log('trips: ', tripId);
  getToken(AUTH_TOKEN).then(token => {
    axios
      .post(
        `${AWS_BASE_URL}/didDriverAccept`,
        {
          tripId: tripId,
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      )
      .then(response => {
        const {driverInfo} = response.data || {};
        if (driverInfo) {
          store.dispatch(
            driverAcceptedTrip({
              driverInfo: driverInfo[0],
              shouldUpdateTripStatus,
            }),
          );
          //clearInterval(intervalId);
        }
      })
      .catch(error => {
        console.log('error in fetching didDriverAccept: ', error);
      });
  });
};

export const didDriverStartDelivery = ({intervalId, store, tripId}) => {
  getToken(AUTH_TOKEN).then(token => {
    axios
      .post(
        `${AWS_BASE_URL}/didDriverStartDelivery`,
        {
          tripId: tripId,
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      )
      .then(response => {
        const {deliveryStarted} = response.data || {};
        if (deliveryStarted) {
          store.dispatch(
            driverStartingDelivery({
              deliveryStarted,
            }),
          );
          clearInterval(intervalId);
        }
      })
      .catch(error => {
        console.log('error in fetching didDriverAccept: ', error);
      });
  });
};

export const getDriverLocation = ({polyline, setPolyline, store, tripId}) => {
  getToken(AUTH_TOKEN).then(token => {
    axios
      .post(
        `${AWS_BASE_URL}/getDriverLocation`,
        {tripId: tripId},
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      )
      .then(response => {
        const {location} = response.data || {};
        const latitude = location.coordinates[1];
        const longitude = location.coordinates[0];
        const polylineLastIndex = polyline.length - 1;
        if (latitude && longitude && polylineLastIndex > 0) {
          store.dispatch(
            updateDriverLocation({location: {latitude, longitude}}),
          );
          const driverDistanceToDelivery = getDistanceFromLatLonInKm(
            latitude,
            longitude,
            polyline[polylineLastIndex].latitude,
            polyline[polylineLastIndex].longitude,
          );
          const newPolyline = polyline.filter(point => {
            return (
              driverDistanceToDelivery >=
              getDistanceFromLatLonInKm(
                point.latitude,
                point.longitude,
                polyline[polylineLastIndex].latitude,
                polyline[polylineLastIndex].longitude,
              )
            );
          });
          setPolyline(newPolyline);
        } else {
          return polyline;
        }
      })
      .catch(error => {
        console.log('error in fetching didDriverAccept: ', error);
      });
  });
};

export const modifyPolyline = ({polyline, setPolyline, location}) => {
  const latitude = location.latitude;
  const longitude = location.longitude;
  const polylineLastIndex = polyline.length - 1;
  if (latitude && longitude && polylineLastIndex > 0) {
    const driverDistanceToDelivery = getDistanceFromLatLonInKm(
      latitude,
      longitude,
      polyline[polylineLastIndex].latitude,
      polyline[polylineLastIndex].longitude,
    );
    const newPolyline = polyline.filter(point => {
      return (
        driverDistanceToDelivery >=
        getDistanceFromLatLonInKm(
          point.latitude,
          point.longitude,
          polyline[polylineLastIndex].latitude,
          polyline[polylineLastIndex].longitude,
        )
      );
    });
    setPolyline(prevPolyline => {
      if (newPolyline.length !== prevPolyline.length) {
        return newPolyline;
      } else {
        return prevPolyline;
      }
    });
  }
};

export const didUserPay = ({intervalId, setUserPaid, tripId}) => {
  getToken(AUTH_TOKEN).then(token => {
    axios
      .post(
        `${AWS_BASE_URL}/didUserPay`,
        {
          tripId: tripId,
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      )
      .then(response => {
        const {success} = response.data || {};
        if (success) {
          setUserPaid(true);
          clearInterval(intervalId);
        }
      })
      .catch(error => {
        console.log('error in fetching didUserPay: ', error);
      });
  });
};

export const getUpdatedTripTime = ({setTripTime, tripId}) => {
  setTripTime(prevValue => ({...prevValue, [tripId]: {loading: true}}));
  getToken(AUTH_TOKEN).then(token => {
    axios
      .post(
        `${AWS_BASE_URL}/distanceAndTime`,
        {
          trip_id: tripId,
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      )
      .then(response => {
        setTripTime(prevValue => ({
          ...prevValue,
          [tripId]: {...response.data},
        }));
      })
      .catch(error => {
        console.log(
          'error in fetching latest time and distance: ',
          error.message,
        );
        setTripTime(prevValue => ({...prevValue, [tripId]: {loading: false}}));
      });
  });
};

export const getNearByDrivers = ({location, tripId}) => {
  return new Promise((resolve, reject) => {
    getToken(AUTH_TOKEN)
      .then(token => {
        axios
          .post(
            `${AWS_BASE_URL}/getNearByDrivers`,
            {
              latitude: location.latitude,
              longitude: location.longitude,
              tripId,
            },
            {
              headers: {
                authorization: `Bearer ${token}`,
              },
            },
          )
          .then(response => {
            resolve(response.data);
          })
          .catch(error => {
            reject(error);
          });
      })
      .catch(error => {
        reject(error);
      });
  });
};

export const extendRideTime = ({extraHour, tripId}) => {
  return new Promise((resolve, reject) => {
    getToken(AUTH_TOKEN).then(token => {
      axios
        .post(
          `${AWS_BASE_URL}/extraHoursAdd`,
          {
            extraHour,
            tripId,
          },
          {
            headers: {
              authorization: `Bearer ${token}`,
            },
          },
        )
        .then(response => resolve(response))
        .catch(error => reject(error));
    });
  });
};

export const verifyOTP = ({OTP, tripId}) => {
  return new Promise((resolve, reject) => {
    getToken(AUTH_TOKEN).then(token => {
      axios
        .post(
          `${AWS_BASE_URL}/verifyOtp`,
          {
            OTP: Number(OTP),
            tripId,
          },
          {
            headers: {
              authorization: `Bearer ${token}`,
            },
          },
        )
        .then(response => resolve(response.data))
        .catch(error => reject(error));
    });
  });
};

export const changeVehicleType = ({isUberDriver, vehicleType}) => {
  return new Promise((resolve, reject) => {
    getToken(AUTH_TOKEN).then(token => {
      axios
        .post(
          `${AWS_BASE_URL}/updateVehicleInfo`,
          {
            isUberDriver,
            vehicleType,
          },
          {
            headers: {
              authorization: `Bearer ${token}`,
            },
          },
        )
        .then(response => resolve(response.data))
        .catch(error => reject(error));
    });
  });
};

export const getTripStatus = ({tripId}) => {
  return new Promise((resolve, reject) => {
    getToken(AUTH_TOKEN).then(token => {
      axios
        .post(
          `${AWS_BASE_URL}/getTrip`,
          {tripId},
          {
            headers: {
              authorization: `Bearer ${token}`,
            },
          },
        )
        .then(response => resolve(response.data))
        .catch(error => reject(error));
    });
  });
};
