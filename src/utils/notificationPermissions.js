import messaging from '@react-native-firebase/messaging';
import {Platform} from 'react-native';
import {checkPermission} from './locationPermission';
import {PERMISSIONS} from 'react-native-permissions';

export async function requestNotificationPermission() {
  if (Platform.OS === 'android') {
    const enabled = await checkPermission(
      PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
    );
    if (enabled) {
      console.log('Authorization status:', enabled);
    }
  } else {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
    }
  }
}
