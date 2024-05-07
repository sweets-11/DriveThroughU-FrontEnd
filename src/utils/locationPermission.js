import {Platform} from 'react-native';
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions';

export const checkPermission = permission => {
  return new Promise((resolve, reject) => {
    check(permission)
      .then(result => {
        switch (result) {
          case RESULTS.UNAVAILABLE:
            console.log(
              'This feature is not available (on this device / in this context)',
            );
            resolve(0);
            break;
          case RESULTS.DENIED:
            console.log(
              'The permission has not been requested / is denied but requestable',
            );
            request(permission)
              .then(grantingResult => {
                switch (grantingResult) {
                  case RESULTS.GRANTED:
                    resolve(2);
                    break;
                  case RESULTS.LIMITED:
                    resolve(1);
                    break;
                  case RESULTS.DENIED:
                  case RESULTS.BLOCKED:
                    resolve(0);
                    break;
                }
              })
              .catch(error => {
                console.log('error in requesting permission: ', error);
                resolve(error);
              });

            break;
          case RESULTS.LIMITED:
            console.log('The permission is limited: some actions are possible');
            resolve(1);
            break;
          case RESULTS.GRANTED:
            console.log('The permission is granted');
            resolve(2);
            break;
          case RESULTS.BLOCKED:
            console.log('The permission is denied and not requestable anymore');
            resolve(0);
            break;
        }
      })
      .catch(error => {
        console.log('error in asking permissoin: ', error);
        reject(error);
      });
  });
};

export const getLocationPermission = () => {
  return new Promise((resolve, reject) => {
    checkPermission(
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    )
      .then(result => {
        switch (result) {
          case 0:
            reject(0);
            break;
          case 1:
            reject(0);
            break;
          case 2:
            resolve(2);
          default:
            reject(0);
            break;
        }
      })
      .catch(error => reject(error));
  });
};
