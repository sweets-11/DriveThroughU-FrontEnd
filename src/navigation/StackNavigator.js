import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import {ScreenNames} from './ScreenNames';
import SignupScreen from '../screens/SignupScreen';
import GroceryScreen from '../screens/GroceryScreen';
import HomeScreen from '../screens/HomeScreen';
import ParcelScreen from '../screens/ParcelScreen';
import AddAddressScreen from '../screens/AddAddressScreen';
import GroceryListScreen from '../screens/GroceryListScreen';
import DeliveryScreen from '../screens/DeliveryScreen';
import PaymentScreen from '../screens/PaymentScreen';
import colors from '../config/colors';
import MyProfile from '../screens/MyProfile';
import DriverOnboardingScreen from '../screens/DriverOnboardingScreen';
import WebViewScreen from '../screens/WebViewScreen';
import OpenTripsScreen from '../screens/DriverScreens/OpenTripsScreen';
import OnTheMoveScreen from '../screens/DriverScreens/OnTheMoveScreen';
import SupportScreen from '../screens/SupportScreen';
import CarRentScreen from '../screens/CarRentScreen';
import CarRentPickupScreen from '../screens/CarRentPickupScreen';
import OnTheRideScreen from '../screens/DriverScreens/OnTheRideScreen';

const Stack = createStackNavigator();

const StackNavigator = ({initialRouteName, setInitialRouteName}) => {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        headerBackTitleVisible: false,
        headerStyle: {backgroundColor: colors.tertiary, height: 56},
        headerTintColor: colors.white,
      }}>
      <Stack.Screen
        name={ScreenNames.SIGNUP_SCREEN}
        component={SignupScreen}
        options={{headerShown: true, headerTitle: 'Sign Up'}}
        initialParams={{setInitialRouteName}}
      />
      <Stack.Screen
        name={ScreenNames.LOGIN_SCREEN}
        component={LoginScreen}
        options={{headerShown: true, headerTitle: 'Log In'}}
        initialParams={{setInitialRouteName}}
      />
      <Stack.Screen
        name={ScreenNames.HOME_SCREEN}
        component={HomeScreen}
        options={{headerShown: false, headerTitle: 'Home'}}
      />
      <Stack.Screen
        name={ScreenNames.GROCERY_SCREEN}
        component={GroceryScreen}
        options={{headerShown: true, headerTitle: 'Select shop'}}
      />
      <Stack.Screen
        name={ScreenNames.PARCEL_SCREEN}
        component={ParcelScreen}
        options={{headerShown: true, headerTitle: 'Receive Mail'}}
      />
      <Stack.Screen
        name={ScreenNames.ADD_ADDRESS}
        component={AddAddressScreen}
        options={{headerShown: true, headerTitle: 'Add Address'}}
      />
      <Stack.Screen
        name={ScreenNames.GROCERY_LIST}
        component={GroceryListScreen}
        options={{headerShown: true, headerTitle: 'Create shopping list'}}
      />
      <Stack.Screen
        name={ScreenNames.DELIVERY_SCREEN}
        component={DeliveryScreen}
        options={{
          headerShown: true,
          headerTitle: 'Delivery',
          //headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name={ScreenNames.PAYMENT_SCREEN}
        component={PaymentScreen}
        options={{
          headerShown: true,
          headerTitle: 'Checkout',
        }}
      />
      <Stack.Screen
        name={ScreenNames.MY_PROFILE_SCREEN}
        component={MyProfile}
        options={{
          headerShown: true,
          headerTitle: 'My Profile',
        }}
      />
      <Stack.Screen
        name={ScreenNames.DRIVER_ONBOARDING_SCREEN}
        component={DriverOnboardingScreen}
        options={{
          headerShown: true,
          headerTitle: 'Onboarding',
        }}
      />
      <Stack.Screen
        name={ScreenNames.WEBVIEW_SCREEN}
        component={WebViewScreen}
        options={{
          headerShown: true,
          headerTitle: '',
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name={ScreenNames.OPEN_TRIPS_SCREEN}
        component={OpenTripsScreen}
        options={{headerShown: false, headerTitle: 'Open Trips'}}
      />
      <Stack.Screen
        name={ScreenNames.ON_THE_MOVE_SCREEN}
        component={OnTheMoveScreen}
        options={{
          headerShown: true,
          headerTitle: 'On the move',
          headerLeft: null,
        }}
      />
      <Stack.Screen
        name={ScreenNames.ON_THE_RIDE_SCREEN}
        component={OnTheRideScreen}
        options={{
          headerShown: true,
          headerTitle: 'Car rent',
          headerLeft: null,
        }}
      />
      <Stack.Screen
        name={ScreenNames.SUPPORT_SCREEN}
        component={SupportScreen}
        options={{
          headerShown: true,
          headerTitle: 'DriveThroughU Support Chat',
        }}
      />
      <Stack.Screen
        name={ScreenNames.CAR_RENT_SCREEN}
        component={CarRentScreen}
        options={{
          headerShown: true,
          headerTitle: 'Rent a Car',
        }}
      />
      <Stack.Screen
        name={ScreenNames.CAR_RENT_PICKUP_SCREEN}
        component={CarRentPickupScreen}
        options={{
          headerShown: true,
          headerTitle: 'Picking you up',
        }}
      />
    </Stack.Navigator>
  );
};

export default StackNavigator;
