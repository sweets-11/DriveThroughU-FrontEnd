import notifee, {AndroidColor, EventType} from '@notifee/react-native';
import {KEYS, getToken, storeToken} from '../utils/storage';
import colors from '../config/colors';
import {Platform} from 'react-native';

/** Fore ground -
 * A new FCM message arrived!
 * {
    "notification": {
        "android": {},
        "body": "Testing 6",
        "title": "Test 6"
    },
    "sentTime": 1704898788952,
    "data": {},
    "from": "/topics/ZipCart",
    "messageId": "0:1704898789017125%3b205a543b205a54",
    "ttl": 2419200,
    "collapseKey": "com.zipcart"
}
 * 
 * 
 * Background - 
 * 
 * {
    "notification": {
        "android": {},
        "body": "Testing 10",
        "title": "Test 10"
    },
    "sentTime": 1704901829567,
    "data": {},
    "from": "/topics/ZipCart",
    "messageId": "0:1704901829611922%3b205a543b205a54",
    "ttl": 2419200,
    "collapseKey": "com.zipcart"
}
 */

const displayNotification = (title = '', body = '', pressAction = 'none') => {
  if (!title && !body) return;
  notifee
    .createChannel({
      id: 'DriveThroughU',
      lights: true,
      lightColor: AndroidColor.WHITE,
      name: 'DriveThroughU',
      sound: 'default',
      vibration: true,
      vibrationPattern: [300, 500],
    })
    .then(resp => {
      notifee.displayNotification({
        title:
          Platform.OS === 'ios'
            ? title
            : `<p style="color: ${colors.secondary};"><b>${title}</span></p></b></p>`,
        body,
        android: {
          channelId: resp,
          color: colors.secondary,
          pressAction: {
            id: pressAction,
            mainComponent: 'zipcart',
          },
          smallIcon: 'ic_notification',
        },
      });
    })
    .catch(e => {
      console.log('error in notification: ', e);
    });
};

export const eventHandler = onPress => ({
  foreground: notifee.onForegroundEvent(({type, detail}) => {
    switch (type) {
      case EventType.DISMISSED:
        console.log('User dismissed notification', detail.notification);
        break;
      case EventType.PRESS:
        console.log('User pressed notification', detail.notification);
        if (detail.notification.android.pressAction?.id !== 'none') {
          onPress && onPress(detail.notification.android.pressAction.id);
          notifee.cancelNotification(detail.notification.id);
        }
        break;
    }
  }),
  background: notifee.onBackgroundEvent(
    async ({type, detail: {notification}}) => {
      if (
        type === EventType.PRESS &&
        notification?.android.pressAction?.id !== 'none'
      ) {
        onPress && onPress(notification.android.pressAction.id);
        await notifee.cancelNotification(notification.id);
      }
    },
  ),
});

export const getInitialNotification = onPress => {
  notifee.getInitialNotification().then(initialNotification => {
    if (initialNotification) {
      console.log(
        'Notification caused application to open',
        initialNotification.notification,
      );
      console.log(
        'Press action used to open the app',
        initialNotification.pressAction,
      );
      onPress && onPress(initialNotification.pressAction?.id);
    }
  });
};

export const storeNotification = (notification, callback) => {
  console.log('Storing notification: ', notification.messageId);
  getToken(KEYS.NOTIFICATION_KEY).then(notificaitons => {
    if (notificaitons && Object.keys(notificaitons || {}).length) {
      notificaitons[notification.messageId] = notification;
      storeToken({key: KEYS.NOTIFICATION_KEY, value: notificaitons}).then(
        () => callback && callback(),
      );
    } else {
      let newNotificationObject = {};
      newNotificationObject[notification.messageId] = notification;
      storeToken({key: KEYS.NOTIFICATION_KEY, value: newNotificationObject});
    }
  });
};

export const getNotifications = async () => {
  const notifcations = await getToken(KEYS.NOTIFICATION_KEY);
  return notifcations;
};

export const deleteNotification = (callback, messageId) => {
  getToken(KEYS.NOTIFICATION_KEY).then(notificaitons => {
    if (notificaitons && Object.keys(notificaitons || {}).length) {
      delete notificaitons[messageId];
      storeToken({key: KEYS.NOTIFICATION_KEY, value: notificaitons}).then(
        () => callback && callback(),
      );
    } else {
      console.log('No notifications to delete');
    }
  });
};

export default displayNotification;
