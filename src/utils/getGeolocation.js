import Geolocation from '@react-native-community/geolocation';
import {Alert, Platform} from 'react-native';
import GetLocation from 'react-native-get-location';

export const getGeolocation = locationPermission => {
  if (!locationPermission) {
    Alert.alert('Please provide the location permission first');
    return Promise.reject('Permission not granted');
  }
  return new Promise((resolve, reject) => {
    if (__DEV__ && Platform.OS === 'ios') {
      resolve({
        coords: {
          accuracy: 5,
          altitude: 5,
          heading: 0,
          latitude: 22.719598333333334,
          longitude: 75.85769833333333,
          speed: 0,
        },
      });
      return;
    }
    if (Platform.OS === 'android') {
      GetLocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 60000,
      })
        .then(location => {
          console.log({coords: {...location}});
          resolve({coords: {...location}});
        })
        .catch(error => {
          const {code, message} = error;
          console.log('location error', code, message);
          reject(error);
        });
    } else {
      Geolocation.setRNConfiguration({
        skipPermissionRequests: false,
        authorizationLevel: 'always',
        enableBackgroundLocationUpdates: true,
        locationProvider: 'auto',
      });
      Geolocation.getCurrentPosition(
        info => {
          console.log(info);
          resolve(info);
        },
        error => {
          console.log('error in getting location: ', error);
          reject(error);
        },
        {
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 0,
        },
      );
    }
  });
};
