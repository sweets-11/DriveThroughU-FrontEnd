import axios from 'axios';
import {getToken, removeToken} from './storage';
import {AUTH_TOKEN} from './otpFunctions';
import {AWS_BASE_URL} from '@env';
import {Alert} from 'react-native';
import {ScreenNames} from '../navigation/ScreenNames';

export const logout = navigation => {
  getToken(AUTH_TOKEN).then(token => {
    axios
      .get(
        `${AWS_BASE_URL}/logout`,
        {},
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      )
      .then(() => {
        removeToken(AUTH_TOKEN);
        navigation.popToTop();
        navigation.replace(ScreenNames.LOGIN_SCREEN);
      })
      .catch(error => {
        Alert.alert('Logout failed', error.message);
      });
  });
};
