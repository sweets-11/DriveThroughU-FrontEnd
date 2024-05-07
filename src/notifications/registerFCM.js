import messaging from '@react-native-firebase/messaging';
import {getToken} from '../utils/storage';
import {AUTH_TOKEN} from '../utils/otpFunctions';
import axios from 'axios';
import {AWS_BASE_URL} from '@env';

const FIREBASE_TOPIC = 'DriveThroughU';

export const registerFCM = () => {
  messaging()
    .subscribeToTopic(FIREBASE_TOPIC)
    .then(() => console.log('Subscribed to topic!'));
  messaging()
    .registerDeviceForRemoteMessages()
    .then(() => {
      messaging()
        .getToken()
        .then(fcmToken => {
          getToken(AUTH_TOKEN).then(token => {
            axios
              .post(
                `${AWS_BASE_URL}/registerFcmToken`,
                {
                  token: fcmToken,
                },
                {
                  headers: {
                    authorization: `Bearer ${token}`,
                  },
                },
              )
              .then(response => {
                console.log('response from sending fcm token: ', response.data);
              })
              .catch(error => {
                console.log('error in sending FCM token: ', error.message);
              });
          });
          console.log('FCM token: ', fcmToken);
        });
    });
};
