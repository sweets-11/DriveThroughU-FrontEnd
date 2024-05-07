import axios from 'axios';
import {AWS_BASE_URL} from '@env';
import {
  getAddresses,
  getAddressesSuccess,
  getAddressesError,
  addAddress,
  addAddressSucess,
  addAddressError,
  deleteAddress,
  deleteAddressFail,
  deleteAddressSuccess,
} from '../reducers/AddressReducer';
import {getToken} from '../../utils/storage';
import {AUTH_TOKEN} from '../../utils/otpFunctions';
import {setUserData} from '../reducers/UserReducer';
import {convertToBool} from '../../utils/stringOperators';
import {
  setOnBoardingStatus,
  switchDeliveryMode,
} from '../reducers/DeliveryModeReducer';

const callAddressEndpoint =
  ({dispatch}) =>
  next =>
  action => {
    if (action.type === getAddresses.type) {
      next(action);
      getToken(AUTH_TOKEN).then(token => {
        axios
          .post(
            `${AWS_BASE_URL}/getmyprofile`,
            {},
            {
              headers: {
                authorization: `Bearer ${token}`,
              },
            },
          )
          .then(response => {
            const {
              dob,
              email,
              firstName,
              isDeliveryAgent,
              isDriverModeOn,
              isUberDriver,
              lastName,
              mobileNumber,
              stripeInfo,
              vehicleType,
              verified,
              _id,
            } = response.data.data;
            let addresses = response.data.data.address;
            console.log('res form address fetch: ', response.data.data);
            dispatch(
              setUserData({
                dob,
                email,
                firstName,
                isDeliveryAgent,
                isUberDriver,
                lastName,
                mobileNumber,
                stripeInfo,
                vehicleType,
                verified,
                _id,
              }),
            );

            dispatch(
              setOnBoardingStatus({
                isOnboarded: convertToBool(stripeInfo?.stripeOnBoardingStatus),
              }),
            );
            addresses = addresses.map(
              ({
                _id,
                apartment,
                address,
                addressTitle,
                coords,
                floor,
                house,
                instructions,
              }) => {
                return {
                  coords,
                  address: {
                    _id,
                    buildingDetails: `${floor}, ${house}, ${apartment}`,
                    instructions,
                    name: addressTitle,
                    value: `${address.name} ${address.value}`,
                  },
                };
              },
            );
            dispatch(getAddressesSuccess({addresses}));
            dispatch(switchDeliveryMode({deliveryMode: isDriverModeOn}));
          })
          .catch(error => {
            dispatch(getAddressesError({error: error.message}));
          });
      });
    } else {
      return next(action);
    }
  };

const callAddAddressEndpoint =
  ({dispatch}) =>
  next =>
  action => {
    if (action.type === addAddress.type) {
      next(action);
      const {house, floor, apartment, instructions, title} =
        action.payload.address;
      const {address, coords} = action.payload.location;
      getToken(AUTH_TOKEN).then(token => {
        axios
          .post(
            `${AWS_BASE_URL}/newaddress`,
            {
              addressTitle: title,
              house,
              address,
              coords,
              floor,
              apartment,
              instructions,
            },
            {
              headers: {
                authorization: `Bearer ${token}`,
              },
            },
          )
          .then(response => {
            console.log('res form add address: ', response.data);
            dispatch(addAddressSucess());
            action.payload.successCallback();
          })
          .catch(error => {
            dispatch(addAddressError({error}));
          });
      });
    } else {
      return next(action);
    }
  };

const callDeleteAddressEndpoint =
  ({dispatch}) =>
  next =>
  action => {
    if (action.type === deleteAddress.type) {
      next(action);
      const addressId = action.payload.address.address._id;
      getToken(AUTH_TOKEN).then(token => {
        axios
          .delete(`${AWS_BASE_URL}/removeaddress`, {
            headers: {
              authorization: `Bearer ${token}`,
            },
            data: {
              addressId,
            },
          })
          .then(response => {
            dispatch(deleteAddressSuccess({response: response.data}));
            dispatch(getAddresses());
          })
          .catch(error => {
            dispatch(deleteAddressFail({error: error.message}));
          });
      });
    } else {
      return next(action);
    }
  };

export default callAddressEndpoint;
export {callAddAddressEndpoint, callDeleteAddressEndpoint};
