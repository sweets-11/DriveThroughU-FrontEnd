import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import {enableLatestRenderer} from 'react-native-maps';
import {Provider} from 'react-redux';
import {combineReducers} from 'redux';
import {configureStore} from '@reduxjs/toolkit';
import messaging from '@react-native-firebase/messaging';
import SplashScreen from './src/screens/SplashScreen';
import {ScreenNames} from './src/navigation/ScreenNames';
import {getToken} from './src/utils/storage';
import Addresses from './src/store/reducers/AddressReducer';
import Cart from './src/store/reducers/CartReducer';
import DeliveryMode from './src/store/reducers/DeliveryModeReducer';
import Driver from './src/store/reducers/DriverReducer';
import User from './src/store/reducers/UserReducer';
import DriverPayment from './src/store/reducers/DriverPaymentReducer';
import callAddressEndpoint, {
  callAddAddressEndpoint,
  callDeleteAddressEndpoint,
} from './src/store/middlewares/AddressMiddleware';
import callDriverEndpoint from './src/store/middlewares/DriverMiddleware';
import {AUTH_TOKEN} from './src/utils/otpFunctions';
import {connectToSocket} from './src/store/middlewares/SocketMiddleware';
import {
  fetchDailyPayOuts,
  fetchTransfersData,
} from './src/store/middlewares/DriverPaymentMiddleware';
import {userMiddleware} from './src/store/middlewares/UserMiddleware';
import Socket from './src/store/reducers/SocketReducer';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import StatusBarIOS from './src/components/StatusBar';
import colors from './src/config/colors';
import TabNavigator from './src/navigation/TabNavigator';
import {TabNames} from './src/navigation/TabNames';
import {deliveryModeMidleware} from './src/store/middlewares/DeliveryModeMiddleware';
import {registerFCM} from './src/notifications/registerFCM';
import displayNotification, {
  storeNotification,
} from './src/notifications/notification';
import {requestNotificationPermission} from './src/utils/notificationPermissions';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

enableLatestRenderer();
const rootReducer = combineReducers({
  Addresses,
  Cart,
  DeliveryMode,
  Driver,
  DriverPayment,
  Socket,
  User,
});
const navRef = createNavigationContainerRef();
function App() {
  const [splash, setSplash] = useState(true);
  const [initialRouteName, setInitialRouteName] = useState(
    ScreenNames.LOGIN_SCREEN,
  );
  const [ready, setReady] = useState(false);
  const [store, setStore] = useState(null);
  const [routeName, setRouteName] = useState();
  const [linkingConfig, setLinkingConfig] = useState({});

  useEffect(() => {
    setStore(
      configureStore({
        reducer: rootReducer,
        middleware: getDefaultMiddleWare =>
          getDefaultMiddleWare().concat(
            callAddAddressEndpoint,
            callAddressEndpoint,
            callDeleteAddressEndpoint,
            callDriverEndpoint,
            connectToSocket,
            fetchDailyPayOuts,
            fetchTransfersData,
            deliveryModeMidleware,
            userMiddleware,
          ),
      }),
    );
    requestNotificationPermission();
    setTimeout(() => setSplash(false), 2000);
    let unsubscribeFCM = null;
    getToken(AUTH_TOKEN).then(token => {
      if (token) {
        setInitialRouteName(ScreenNames.HOME_SCREEN);
        setLinkingConfig({
          screens: {
            [TabNames.STORE_TAB]: {
              screens: {
                [ScreenNames.PARCEL_SCREEN]: 'mail',
                [ScreenNames.HOME_SCREEN]: '*',
              },
            },
          },
        });
        registerFCM();
        unsubscribeFCM = messaging().onMessage(async remoteMessage => {
          console.log(
            'A new FCM message arrived!',
            JSON.stringify(remoteMessage),
          );
          displayNotification(
            remoteMessage.notification?.title,
            remoteMessage.notification?.body,
          );
          // storeNotification(remoteMessage);
        });
      } else {
        setLinkingConfig({
          screens: {
            [TabNames.STORE_TAB]: {
              screens: {
                [ScreenNames.LOGIN_SCREEN]: '*',
              },
            },
          },
        });
      }
      setReady(true);
    });

    return () => {
      if (unsubscribeFCM) {
        unsubscribeFCM();
      }
    };
  }, []);

  const linking = {
    prefixes: ['zipcart://'],
    config: linkingConfig,
  };
  return ready && !splash && store ? (
    <GestureHandlerRootView style={{flex: 1}}>
      <StatusBar backgroundColor={colors.tertiary} />
      <Provider store={store}>
        <NavigationContainer
          linking={linking}
          fallback={
            <ActivityIndicator
              style={{
                flex: 1,
                backgroundColor: colors.white,
                height: '100%',
                width: '100%',
              }}
              color={colors.secondary}
              size={'large'}
            />
          }
          ref={navRef}
          onReady={() => {
            setRouteName(navRef.getCurrentRoute().name);
          }}
          onStateChange={async () => {
            const currentRouteName = navRef.getCurrentRoute().name;
            setRouteName(currentRouteName);
          }}>
          <SafeAreaProvider style={{flex: 0}}>
            <StatusBarIOS />
          </SafeAreaProvider>
          <SafeAreaView style={styles.container}>
            <TabNavigator
              initialRouteName={initialRouteName}
              routeName={routeName}
              setInitialRouteName={setInitialRouteName}
            />
          </SafeAreaView>
        </NavigationContainer>
      </Provider>
    </GestureHandlerRootView>
  ) : (
    <SplashScreen />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
