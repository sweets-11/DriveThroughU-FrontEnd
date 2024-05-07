import axios from 'axios';
import {AUTH_TOKEN} from './otpFunctions';
import {getToken} from './storage';
import {AWS_BASE_URL} from '@env';

export const placesAPI = ({latitude, longitude, setData, text}) => {
  getToken(AUTH_TOKEN).then(token => {
    axios
      .post(
        `${AWS_BASE_URL}/nearbyPlaces`,
        {
          location: `${latitude}, ${longitude}`,
          keyword: text,
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      )
      .then(response => {
        console.log('Place: ', response.data);
        setData(response.data);
      });
  });
};
