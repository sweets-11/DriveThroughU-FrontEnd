import React, {useContext, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  StyleSheet,
  View,
} from 'react-native';
import WebView from 'react-native-webview';
import colors from '../config/colors';
import Loader from '../components/Loader/Loader';
import axios from 'axios';
import {getToken} from '../utils/storage';
import {AUTH_TOKEN} from '../utils/otpFunctions';
import {AWS_BASE_URL} from '@env';
import {ReactReduxContext} from 'react-redux';
import {
  setOnBoardingStatus,
  switchDeliveryMode,
} from '../store/reducers/DeliveryModeReducer';
import {getSelectedAddress} from '../store/selectors/AddressSelectors';

const WebViewScreen = ({
  navigation,
  route: {
    params: {url, title = '', licenseNumber, vehicleNumber, vehicleType},
  },
}) => {
  const {store} = useContext(ReactReduxContext);
  const [showLoader, setShowLoader] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(
    getSelectedAddress(store.getState()),
  );
  useEffect(() => {
    navigation.setOptions({headerTitle: title});
  }, [navigation, title]);
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setSelectedAddress(getSelectedAddress(store.getState()));
    });
    return () => {
      unsubscribe();
    };
  }, [store]);
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    return () => backHandler.remove();
  }, []);

  console.log('webview: ', licenseNumber, vehicleNumber, vehicleType);

  const onBoardingFailed = () => {
    setShowLoader(false);
    Alert.alert(
      'Sorry!',
      'There was some error during onboarding. Please try again',
      [
        {
          text: 'Okay',
          style: 'default',
          onPress: () => {
            store.dispatch(switchDeliveryMode({deliveryMode: false}));
            store.dispatch(
              setOnBoardingStatus({
                isOnboarded: false,
              }),
            );
            navigation.pop(1);
          },
        },
      ],
    );
  };
  const onMessage = ({nativeEvent: {data}}) => {
    setShowLoader(true);
    getToken(AUTH_TOKEN).then(token => {
      axios
        .post(
          `${AWS_BASE_URL}/order/verifyOnboarding`,
          {
            licenseNumber,
            vehicleNumber,
            vehicleType: vehicleType?.value,
            isUberDriver: true,
            location: {
              latitude: selectedAddress?.coords?.latitude || 0.0,
              longitude: selectedAddress?.coords?.longitude || 0.0,
            },
          },
          {
            headers: {
              authorization: `Bearer ${token}`,
            },
          },
        )
        .then(response => {
          console.log('response: ', response.data);
          if (response.data?.success) {
            setShowLoader(false);
            Alert.alert(
              'Congratulations!',
              'You have been onboarded to DriveThroughU successfully.',
              [
                {
                  text: 'Okay',
                  style: 'default',
                  onPress: () => {
                    store.dispatch(switchDeliveryMode({deliveryMode: true}));
                    store.dispatch(
                      setOnBoardingStatus({
                        isOnboarded: true,
                      }),
                    );
                    navigation.pop(2);
                  },
                },
              ],
            );
          } else {
            onBoardingFailed();
          }
        })
        .catch(error => {
          console.log('Error in verifying onboarding: ', error);
          onBoardingFailed();
        });
    });
  };
  const RenderLoader = () => (
    <View style={styles.loaderContainer}>
      <ActivityIndicator color={colors.secondary} size={'large'} />
    </View>
  );
  return (
    <View style={styles.container}>
      <WebView
        onMessage={onMessage}
        renderLoading={RenderLoader}
        source={{uri: url}}
        startInLoadingState={true}
        style={styles.webView}
        onNavigationStateChange={data =>
          console.log('webview state changed: ', data)
        }
        cacheMode="LOAD_NO_CACHE"
        cacheEnabled={false}
      />
      <Loader visible={showLoader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    flex: 1,
  },
  loaderContainer: {
    alignItems: 'center',
    backgroundColor: colors.white,
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    position: 'absolute',
    width: '100%',
  },
  webView: {
    flex: 1,
  },
});

export default WebViewScreen;
