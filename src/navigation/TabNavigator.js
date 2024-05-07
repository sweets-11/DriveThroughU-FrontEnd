import React, {useContext, useEffect, useState} from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import StackNavigator from './StackNavigator';
import colors from '../config/colors';
import MyOrdersScreen from '../screens/MyOrdersScreen';
import ParcelScreen from '../screens/ParcelScreen';
import {TabNames} from './TabNames';
import {ReactReduxContext} from 'react-redux';
import {
  getDeliveryMode,
  getIsOnBoarded,
} from '../store/selectors/DeliveryModeSelectors';
import PastTripsScreen from '../screens/DriverScreens/PastTripsScreen';
import TripsPaymentsScreen from '../screens/DriverScreens/PaymentsScreen.js/TripsPaymentsScreen';
import {ScreenNames} from './ScreenNames';

const Tab = createBottomTabNavigator();

const TabNavigator = ({initialRouteName, routeName, setInitialRouteName}) => {
  const {store} = useContext(ReactReduxContext);
  const hide = routeName === 'LoginScreen' || routeName === 'SignupScreen';
  const [switchToDeliveryMode, setSwitchToDeliveryMode] = useState(
    getDeliveryMode(store.getState()) && getIsOnBoarded(store.getState()),
  );
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      if (getIsOnBoarded(store.getState())) {
        setSwitchToDeliveryMode(getDeliveryMode(store.getState()));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [store]);

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName;
          switch (route.name) {
            case TabNames.STORE_TAB:
              iconName = 'store-outline';
              break;
            case TabNames.MY_ORDERS_TAB:
              iconName = 'shopping-outline';
              break;
            case TabNames.PARCEL_TAB:
              iconName = 'truck-fast';
              break;
            case TabNames.OPEN_TRIPS_TAB:
              iconName = 'format-list-bulleted-square';
              break;
            case TabNames.PAST_TRIPS_TAB:
              iconName = 'history';
              break;
            case TabNames.PAYMENTS_TAB:
              iconName = 'currency-usd';
              break;
            default:
              break;
          }
          if (route.name === 'Stores') {
          } else if (route.name === 'My orders') {
            iconName = 'shopping-outline';
          }
          return (
            <MaterialCommunityIcons name={iconName} size={size} color={color} />
          );
        },
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.neutralGrey,
        headerStyle: {backgroundColor: colors.tertiary, height: 56},
        headerTintColor: colors.white,
        headerShown: true,
        tabBarLabelStyle: {fontSize: 14},
        tabBarStyle: {display: hide ? 'none' : 'flex'},
      })}>
      <Tab.Screen
        name={
          switchToDeliveryMode ? TabNames.OPEN_TRIPS_TAB : TabNames.STORE_TAB
        }
        options={{headerShown: false}}>
        {() => (
          <StackNavigator
            initialRouteName={
              switchToDeliveryMode
                ? ScreenNames.OPEN_TRIPS_SCREEN
                : initialRouteName
            }
            setInitialRouteName={setInitialRouteName}
          />
        )}
      </Tab.Screen>
      {switchToDeliveryMode ? null : (
        <Tab.Screen component={MyOrdersScreen} name={TabNames.MY_ORDERS_TAB} />
      )}
      {switchToDeliveryMode ? null : (
        <Tab.Screen
          component={ParcelScreen}
          initialParams={{isSendParcel: false}}
          options={{headerShown: true}}
          name={TabNames.PARCEL_TAB}
        />
      )}
      {switchToDeliveryMode ? (
        <Tab.Screen
          component={PastTripsScreen}
          options={{headerShown: true}}
          name={TabNames.PAST_TRIPS_TAB}
        />
      ) : null}
      {switchToDeliveryMode ? (
        <Tab.Screen
          component={TripsPaymentsScreen}
          options={{headerShown: false}}
          name={TabNames.PAYMENTS_TAB}
        />
      ) : null}
    </Tab.Navigator>
  );
};

export default TabNavigator;
