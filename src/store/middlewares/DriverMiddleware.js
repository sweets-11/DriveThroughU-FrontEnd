import axios from 'axios';
import {AWS_BASE_URL} from '@env';
import {
  driverAcceptedTrip,
  driverStartingDelivery,
  findDriver,
  findDriverError,
  findDriversSuccess,
  getTripStatus,
  updateTrip,
} from '../reducers/DriverReducer';
import {getToken} from '../../utils/storage';
import {AUTH_TOKEN} from '../../utils/otpFunctions';

const callDriverEndpoint =
  ({dispatch}) =>
  next =>
  action => {
    if (action.type === findDriver.type) {
      next(action);
      const {
        selectedShop,
        deliveryLocation,
        isCarRent,
        isParcelDelivery,
        list,
        orderDetails,
      } = action.payload;
      const {geometry: {location: {lat, lng} = {}} = {}} = selectedShop || {};
      getToken(AUTH_TOKEN).then(token => {
        let body = {};
        if (isCarRent) {
          body = {
            pickup_Location: {
              address:
                orderDetails.pickupAddress.buildingDetails +
                ', ' +
                orderDetails.pickupAddress.value,
              address_name: orderDetails.pickupAddress.name,
              longitude: String(orderDetails.pickupAddress.longitude),
              latitude: String(orderDetails.pickupAddress.latitude),
            },
            tripType: 'Car Rent',
            vehicleType: orderDetails.vehicleType[0].value,
            hours: Number(orderDetails.hours[0]),
          };
        } else {
          body = {
            pickup_Location: {
              address: isParcelDelivery
                ? orderDetails.pickupAddress.buildingDetails +
                  ', ' +
                  orderDetails.pickupAddress.value
                : selectedShop.vicinity,
              address_name: isParcelDelivery
                ? orderDetails.pickupAddress.name
                : selectedShop.name,
              longitude: String(
                isParcelDelivery ? orderDetails.pickupAddress.longitude : lng,
              ),
              latitude: String(
                isParcelDelivery ? orderDetails.pickupAddress.latitude : lat,
              ),
            },
            dropoff_Location: {
              address: isParcelDelivery
                ? orderDetails.deliveryAddress.buildingDetails +
                  ', ' +
                  orderDetails.deliveryAddress.value
                : deliveryLocation.address.buildingDetails +
                  ', ' +
                  deliveryLocation.address.value,
              address_name: isParcelDelivery
                ? orderDetails.deliveryAddress.name
                : deliveryLocation.address.name,
              latitude: String(
                isParcelDelivery
                  ? orderDetails.deliveryAddress.latitude
                  : deliveryLocation.coords.latitude,
              ),
              longitude: String(
                isParcelDelivery
                  ? orderDetails.deliveryAddress.longitude
                  : deliveryLocation.coords.longitude,
              ),
            },
            tripType: isParcelDelivery ? 'Mail Delivery' : 'Grocery Delivery',
            orderItems: isParcelDelivery ? orderDetails.packageContent : list,
          };
        }
        axios
          .post(`${AWS_BASE_URL}/saveTripRequest`, body, {
            headers: {
              authorization: `Bearer ${token}`,
            },
          })
          .then(response => {
            let nearbyDrivers = [];
            const {nearestDrivers, triprequest} = response.data || {};
            (nearestDrivers || []).map(driver => {
              nearbyDrivers.push({
                name: driver.name,
                vehicleNumberPlate: driver.vehicleNumber,
                location: {
                  latitude: driver.currentLocation.coordinates[1],
                  longitude: driver.currentLocation.coordinates[0],
                },
              });
            });
            dispatch(
              findDriversSuccess({drivers: nearbyDrivers, trip: triprequest}),
            );
          })
          .catch(error => {
            console.log('Error: ', error);
            dispatch(findDriverError({error}));
          });
      });
    } else if (action.type === getTripStatus.type) {
      next(action);
      getToken(AUTH_TOKEN).then(token => {
        axios
          .post(
            `${AWS_BASE_URL}/getTrip`,
            {tripId: action.payload.tripId},
            {
              headers: {
                authorization: `Bearer ${token}`,
              },
            },
          )
          .then(response => {
            const trip = response.data.trip[0];
            dispatch(updateTrip({trip}));
          })
          .catch(error => {
            console.log('error in fetching trip: ', error);
          });
      });
    } else {
      return next(action);
    }
  };

export default callDriverEndpoint;
