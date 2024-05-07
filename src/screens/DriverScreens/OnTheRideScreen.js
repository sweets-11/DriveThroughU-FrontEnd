import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../../config/colors';
import MapView, {Marker, PROVIDER_GOOGLE, Polyline} from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getDirections,
  getDistanceFromLatLonInKm,
  getRegionForCoordinates,
} from '../../utils/mapUtils';
import Button from '../../components/Button';
import Label from '../../components/Label';
import {ReactReduxContext} from 'react-redux';
import {
  DRIVER_STATUS,
  resetDeliveryModeState,
  setDriverStatus,
  updateDeliveryTrip,
  updateLocation,
} from '../../store/reducers/DeliveryModeReducer';
import {
  getDeliveryTripStatus,
  getDriverStatus,
  getLocation,
} from '../../store/selectors/DeliveryModeSelectors';
import Modal from '../../components/Modal';
import CheckBox from '@react-native-community/checkbox';
import {
  didUserPay,
  getTripStatus,
  modifyPolyline,
  verifyOTP,
} from '../../utils/driverFunctions';
import {startBgTask, stopBgTask} from '../../utils/backgroundTask';
import {addHours, differenceInSeconds} from 'date-fns';
import Loader from '../../components/Loader/Loader';
import {getGeolocation} from '../../utils/getGeolocation';
import Geolocation from '@react-native-community/geolocation';
import {getLocationPermission} from '../../utils/locationPermission';

const Item = ({name, qty, style = {}, collected, setCollected}) => {
  return (
    <View
      style={{
        ...styles.itemContainer,
        ...style,
      }}>
      <CheckBox
        disabled={false}
        onCheckColor={colors.secondary}
        onTintColor={colors.secondary}
        onValueChange={setCollected}
        value={collected}
        tintColors={{false: colors.neutralGrey, true: colors.secondary}}
      />
      <View
        style={{
          ...styles.item,
          ...style,
        }}>
        <Label
          text={name}
          style={{...styles.deliveryTypeText, fontWeight: 'bold'}}
        />
        {qty ? <Label text={qty} style={styles.deliveryTypeText} /> : null}
      </View>
    </View>
  );
};

const OnTheRideScreen = ({
  navigation,
  route: {
    params: {tripDetail: trip},
  },
}) => {
  const {store} = useContext(ReactReduxContext);
  const appState = useRef(AppState.currentState);
  const [polyline, setPolyline] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState(
    getDriverStatus(store.getState()),
  );
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [loader, setLoader] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [userPaid, setUserPaid] = useState(trip?.userPaid);
  const [otpVerified, setOTPVerified] = useState(trip?.didDriverVerifyOtp);
  const [collected, setCollected] = useState({});
  const [location, setLocation] = useState(getLocation(store.getState()));
  const [OTP, setOTP] = useState(0);
  const [locationPermission, setLocationPermission] = useState(false);
  const [tripDetail, setTripDetail] = useState(
    getDeliveryTripStatus(store.getState()),
  );
  const [remainingTime, setRemainingTime] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const pickupLocation = useMemo(
    () => ({
      latitude: tripDetail.pickup_Location.latitude,
      longitude: tripDetail.pickup_Location.longitude,
    }),
    [tripDetail],
  );

  const deliveryFlow = useMemo(() => {
    switch (deliveryStatus) {
      case DRIVER_STATUS.GOING_TO_PICKUP_LOCATION:
      case DRIVER_STATUS.TRIP_ACCEPTED:
      case DRIVER_STATUS.REACHED_PICKUP_LOCATION:
        return 0;
      case DRIVER_STATUS.RIDE_STARTED:
      case DRIVER_STATUS.RIDE_COMPLETED:
      case DRIVER_STATUS.DELIVERED:
      case DRIVER_STATUS.WAITING_FOR_USER_PAYMENT:
        return 1;
      default:
        return 0;
    }
  }, [deliveryStatus]);

  useEffect(() => {
    if (!locationPermission) {
      Geolocation.setRNConfiguration({
        skipPermissionRequests: false,
        authorizationLevel: 'auto',
        enableBackgroundLocationUpdates: true,
        locationProvider: 'auto',
      });
      getLocationPermission()
        .then(result => {
          if (result === 2) {
            setLocationPermission(true);
          } else {
            setLocationPermission(true);
          }
        })
        .catch(error => {
          console.log('Error in getting permission: ', error);
          setLocationPermission(false);
        });
    }
  }, [locationPermission]);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      setDeliveryStatus(getDriverStatus(state));
      setLocation(getLocation(state));
      setTripDetail(getDeliveryTripStatus(state));
    });
    if (deliveryStatus === DRIVER_STATUS.TRIP_ACCEPTED) {
      setTimeout(() =>
        store.dispatch(
          setDriverStatus({
            driverStatus: DRIVER_STATUS.GOING_TO_PICKUP_LOCATION,
            tripId: tripDetail._id,
          }),
        ),
      );
    }
    return () => {
      unsubscribe();
    };
  }, [deliveryStatus, store, tripDetail]);
  useEffect(() => {
    let intervalId = null;
    const startDelivery = () => {
      if (
        (deliveryStatus === DRIVER_STATUS.GOING_TO_PICKUP_LOCATION ||
          deliveryStatus === DRIVER_STATUS.GOING_TO_DELIVERY_LOCATION) &&
        polyline?.length >= 1
      ) {
        intervalId = setInterval(() => {
          if (__DEV__) {
            setPolyline(prevValue => {
              if (prevValue?.length > 1) {
                console.log('got new location');
                const newPolyline = prevValue.slice(1);
                store.dispatch(
                  updateLocation({
                    location: {
                      latitude: newPolyline[0].latitude,
                      longitude: newPolyline[0].longitude,
                    },
                  }),
                );
                return newPolyline;
              } else if (prevValue?.length === 1) {
                console.log('got old location');
                store.dispatch(
                  updateLocation({
                    location: {
                      latitude: prevValue[0].latitude,
                      longitude: prevValue[0].longitude,
                    },
                  }),
                );
                return [];
              }
            });
          } else {
            getGeolocation(locationPermission).then(info => {
              store.dispatch(
                updateLocation({
                  location: {
                    latitude: info?.coords?.latitude,
                    longitude: info?.coords.longitude,
                  },
                }),
              );
            });
          }
        }, 3000);
      } else if (intervalId) {
        clearInterval(intervalId);
      }
    };

    let subscription = null;
    startDelivery();
    subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground!');
        stopBgTask(intervalId);
      } else {
        console.log('App has gone to background!');
        startBgTask(startDelivery);
      }
      appState.current = nextAppState;
    });

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (subscription) {
        subscription.remove();
      }
    };
  }, [store, deliveryStatus, locationPermission, polyline]);

  useEffect(() => {
    if (polyline?.length > 1 && location) {
      modifyPolyline({polyline, setPolyline, location});
    }
  }, [location, polyline]);

  useEffect(() => {
    let intervalId = null;
    if (deliveryStatus === DRIVER_STATUS.WAITING_FOR_USER_PAYMENT) {
      intervalId = setInterval(() => {
        didUserPay({intervalId, setUserPaid, tripId: tripDetail._id});
      }, 3000);
    } else {
      if (intervalId) {
        clearInterval(intervalId);
      }
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [deliveryStatus, tripDetail]);

  useEffect(() => {
    if (
      deliveryStatus === DRIVER_STATUS.GOING_TO_PICKUP_LOCATION &&
      deliveryStatus === DRIVER_STATUS.TRIP_ACCEPTED
    ) {
      let ODPair = {
        origin: `${location.latitude}, ${location.longitude}`,
        destination: `${pickupLocation.latitude}, ${pickupLocation.longitude}`,
      };
      {
        ODPair = {
          origin: `${location.latitude}, ${location.longitude}`,
          destination: `${pickupLocation.latitude}, ${pickupLocation.longitude}`,
        };
      }
      getDirections({...ODPair, setPolyline});
    }
  }, [deliveryStatus, location, pickupLocation]);

  useEffect(() => {
    let titleSuffix = 'Picking up customer';
    switch (deliveryStatus) {
      case DRIVER_STATUS.GOING_TO_PICKUP_LOCATION:
      case DRIVER_STATUS.REACHED_PICKUP_LOCATION:
      case DRIVER_STATUS.TRIP_ACCEPTED:
        titleSuffix = 'Picking up customer';
        break;
      case DRIVER_STATUS.RIDE_STARTED:
        titleSuffix = 'Steering the customer';
        break;
      case DRIVER_STATUS.RIDE_COMPLETED:
      case DRIVER_STATUS.DELIVERED:
        titleSuffix = 'Done';
        break;
      case DRIVER_STATUS.WAITING_FOR_USER_PAYMENT:
        titleSuffix = 'Customer payment';
        break;
      default:
        titleSuffix = '';
        break;
    }
    navigation.setOptions({
      headerTitle: `Car rent - ${titleSuffix}`,
    });
  }, [deliveryStatus, navigation]);

  useEffect(() => {
    let interval = null;
    if (
      deliveryStatus === DRIVER_STATUS.RIDE_STARTED &&
      tripDetail?.carRentTripCreatedAt
    ) {
      interval = setInterval(() => {
        const seconds = differenceInSeconds(
          addHours(tripDetail.carRentTripCreatedAt, tripDetail.totalHour),
          Date.now(),
        );
        setRemainingTime({
          hours: Math.floor(seconds / 3600),
          minutes: Math.floor((seconds % 3600) / 60),
          seconds: Math.floor((seconds % 3600) % 60),
        });
      }, 1000);
    } else {
      if (interval) {
        clearInterval(interval);
      }
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [deliveryStatus, tripDetail?.totalHour, tripDetail?.carRentTripCreatedAt]);
  useEffect(() => {
    let interval = null;
    if (
      remainingTime.hours === 0 &&
      remainingTime.minutes <= 10 &&
      remainingTime.minutes >= 0 &&
      deliveryStatus === DRIVER_STATUS.RIDE_STARTED
    ) {
      interval = setInterval(() => {
        getTripStatus({tripId: tripDetail._id}).then(trip => {
          store.dispatch(updateDeliveryTrip({trip: trip.trip?.[0]}));
        });
      }, 5000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [
    deliveryStatus,
    remainingTime.hours,
    remainingTime.minutes,
    store,
    tripDetail,
  ]);

  const mainActionOnPress = useCallback(() => {
    switch (deliveryStatus) {
      case DRIVER_STATUS.GOING_TO_PICKUP_LOCATION:
        store.dispatch(
          setDriverStatus({
            driverStatus: DRIVER_STATUS.REACHED_PICKUP_LOCATION,
            tripId: tripDetail._id,
          }),
        );
        break;
      case DRIVER_STATUS.REACHED_PICKUP_LOCATION:
        store.dispatch(
          setDriverStatus({
            driverStatus: DRIVER_STATUS.RIDE_STARTED,
            tripId: tripDetail._id,
          }),
        );
        break;
      case DRIVER_STATUS.RIDE_STARTED:
        Alert.alert('Are you sure?', 'Do you really want to end the ride?', [
          {
            isPreferred: false,
            text: 'Yes',
            onPress: () =>
              store.dispatch(
                setDriverStatus({
                  driverStatus: DRIVER_STATUS.WAITING_FOR_USER_PAYMENT,
                  tripId: tripDetail._id,
                }),
              ),
          },
          {
            isPreferred: true,
            text: 'No',
          },
        ]);
        break;
      case DRIVER_STATUS.WAITING_FOR_USER_PAYMENT:
        store.dispatch(
          setDriverStatus({
            driverStatus: DRIVER_STATUS.DELIVERED,
            tripId: tripDetail._id,
          }),
        );
        break;
      case DRIVER_STATUS.DELIVERED:
      case DRIVER_STATUS.RIDE_COMPLETED:
        store.dispatch(resetDeliveryModeState());
        navigation.goBack();
        break;
      default:
        break;
    }
  }, [deliveryStatus, navigation, store, tripDetail._id]);

  const showSecondCTA = useMemo(
    () =>
      !otpVerified && deliveryStatus === DRIVER_STATUS.REACHED_PICKUP_LOCATION,
    [deliveryStatus, otpVerified],
  );
  console.log('deliveryStatus: ', deliveryStatus);
  const mainCTAText = useMemo(
    () =>
      deliveryStatus === DRIVER_STATUS.GOING_TO_PICKUP_LOCATION
        ? 'Reached pickup location'
        : deliveryStatus === DRIVER_STATUS.REACHED_PICKUP_LOCATION
        ? 'Start Steering'
        : deliveryStatus === DRIVER_STATUS.RIDE_STARTED
        ? 'End ride'
        : deliveryStatus === DRIVER_STATUS.WAITING_FOR_USER_PAYMENT
        ? 'Finish'
        : deliveryStatus === DRIVER_STATUS.RIDE_COMPLETED ||
          deliveryStatus === DRIVER_STATUS.DELIVERED
        ? 'Home'
        : 'Finish',
    [deliveryStatus],
  );

  const isDriverNearBy = (location, destination) => {
    return (
      getDistanceFromLatLonInKm(
        Number(location.latitude),
        Number(location.longitude),
        Number(destination.latitude),
        Number(destination.longitude),
      ) < 0.1
    );
  };

  const mainCTADisabled = useMemo(() => {
    return (
      (deliveryStatus === DRIVER_STATUS.GOING_TO_PICKUP_LOCATION &&
        !isDriverNearBy(location, pickupLocation)) ||
      (deliveryStatus === DRIVER_STATUS.WAITING_FOR_USER_PAYMENT && !userPaid)
    );
  }, [deliveryStatus, location, pickupLocation, userPaid]);

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Label
            text={
              deliveryStatus === DRIVER_STATUS.WAITING_FOR_USER_PAYMENT ||
              deliveryStatus === DRIVER_STATUS.RIDE_COMPLETED ||
              deliveryStatus === DRIVER_STATUS.DELIVERED
                ? userPaid
                  ? 'Customer has paid!'
                  : 'Waiting for the customer to pay'
                : deliveryFlow === 0
                ? "Let's pickup the customer!"
                : 'Great! You have picked up the customer.'
            }
            textStyle={styles.title}
          />
          <Label
            text={
              deliveryStatus === DRIVER_STATUS.WAITING_FOR_USER_PAYMENT ||
              deliveryStatus === DRIVER_STATUS.RIDE_COMPLETED ||
              deliveryStatus === DRIVER_STATUS.DELIVERED
                ? userPaid
                  ? 'You can end the ride!'
                  : "Let's wait for the customer to finish payment before ending the ride."
                : "Let's take them to their destination!"
            }
            textStyle={styles.subtitle}
          />
        </View>
        {!(
          deliveryStatus === DRIVER_STATUS.RIDE_STARTED ||
          deliveryStatus === DRIVER_STATUS.RIDE_COMPLETED ||
          deliveryStatus === DRIVER_STATUS.DELIVERED ||
          deliveryStatus === DRIVER_STATUS.WAITING_FOR_USER_PAYMENT
        ) ? (
          <MapView
            provider={PROVIDER_GOOGLE}
            region={getRegionForCoordinates([
              pickupLocation,
              location,
              ...(polyline || []),
            ])}
            showsUserLocation={false}
            showsPointsOfInterest={true}
            moveOnMarkerPress={false}
            onPress={() => {
              const navigateFrom = `${location.latitude},${location.longitude}`;
              const navigateTo = `${pickupLocation.latitude},${pickupLocation.longitude}`;
              const openGoogleMaps = () => {
                Linking.openURL(
                  `https://www.google.com/maps/dir/?api=1&origin=${navigateFrom}&destination=${navigateTo}&travelmode=driving`,
                );
              };
              if (Platform.OS === 'ios') {
                Alert.alert('Open maps', 'Which maps do you want to use?', [
                  {
                    isPreferred: false,
                    text: 'Apple maps',
                    style: 'default',
                    onPress: () => {
                      Linking.openURL(
                        `http://maps.apple.com/maps?saddr=${navigateFrom}&daddr=${navigateTo}&dirflg=d`,
                      );
                    },
                  },
                  {
                    isPreferred: true,
                    text: 'Google maps',
                    style: 'default',
                    onPress: openGoogleMaps,
                  },
                ]);
              } else {
                openGoogleMaps();
              }
            }}
            showsMyLocationButton={false}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            style={{
              ...styles.mapView,
              marginBottom: showSecondCTA ? 144 : 80,
            }}>
            <Marker title={'My location'} coordinate={location}>
              <MaterialCommunityIcons
                name="car-side"
                color={colors.blue}
                size={44}
              />
            </Marker>
            <Marker title={'Pickup location'} coordinate={pickupLocation}>
              <MaterialCommunityIcons
                name="map-marker-radius"
                color={colors.red}
                size={44}
              />
            </Marker>
            {polyline?.length > 1 ? (
              <Polyline
                coordinates={polyline}
                strokeColor="#000"
                strokeWidth={6}
              />
            ) : null}
          </MapView>
        ) : deliveryStatus === DRIVER_STATUS.RIDE_STARTED ? (
          <View style={styles.tripError}>
            <Label
              text={'Remaining ride time is: '}
              textStyle={styles.timerTitle}
            />
            <Label
              text={`${
                remainingTime.hours ? remainingTime.hours + ' hours ' : ''
              } ${
                remainingTime.minutes ? remainingTime.minutes + ' minutes ' : ''
              }${remainingTime.seconds + ' seconds'}`}
              textStyle={{...styles.timerTitle, fontWeight: 'bold'}}
            />
          </View>
        ) : deliveryStatus === DRIVER_STATUS.WAITING_FOR_USER_PAYMENT &&
          !userPaid ? (
          <View style={styles.waitingPaymentLoader}>
            <ActivityIndicator size={'large'} />
            <Label
              text={"Let's wait for the user to complete payment"}
              textStyle={styles.timerTitle}
            />
          </View>
        ) : null}
        <View style={styles.secondaryCTAContainer}>
          {showSecondCTA ? (
            <Button
              onPress={() => {
                if (deliveryStatus === DRIVER_STATUS.REACHED_PICKUP_LOCATION) {
                  setShowOTPModal(true);
                }
              }}
              style={{...styles.secondaryCTA, marginLeft: 4}}
              text={
                deliveryStatus === DRIVER_STATUS.REACHED_PICKUP_LOCATION
                  ? 'Enter OTP'
                  : ''
              }
              textStyle={styles.chanegStatusTextSecondary}
            />
          ) : null}
        </View>
        <Button
          disabled={mainCTADisabled}
          onPress={mainActionOnPress}
          style={{
            ...styles.chanegStatusButton,
            backgroundColor: mainCTADisabled
              ? colors.greyDark
              : colors.secondary,
          }}
          text={mainCTAText}
          textStyle={styles.chanegStatusText}
        />
        <Modal
          animationIn="slideInUp"
          animationOut="slideOutDown"
          onModalClose={() => setShowItemsModal(false)}
          hasBackdrop={true}
          onBackdropPress={() => setShowItemsModal(false)}
          visible={showItemsModal}>
          <SafeAreaView style={styles.pickupItemsModal}>
            <View style={styles.pickupItemsHeader}>
              <Label
                text={'Items to be picked up'}
                textStyle={styles.pickupItemsHeaderText}
              />
              <TouchableOpacity onPress={() => setShowItemsModal(false)}>
                <MaterialCommunityIcons
                  name="close-circle-outline"
                  color={colors.black}
                  size={28}
                />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.itemsContainer}>
              {tripDetail.orderItems?.map((item, index) => (
                <Item
                  collected={collected[index]}
                  key={index.toString()}
                  name={item.item || item.name}
                  qty={item.quantity}
                  setCollected={value =>
                    setCollected(prevValue => ({...prevValue, [index]: value}))
                  }
                  style={{
                    backgroundColor:
                      index % 2 !== 0 ? colors.white : colors.greyLighter,
                  }}
                />
              ))}
            </ScrollView>
            <Label
              text={`Total Items: ${tripDetail.orderItems?.length || 0}`}
              textStyle={styles.totalItems}
            />
          </SafeAreaView>
        </Modal>
        <Modal
          animationIn="slideInUp"
          animationOut="slideOutDown"
          onModalClose={() => setShowOTPModal(false)}
          hasBackdrop={true}
          onBackdropPress={() => setShowOTPModal(false)}
          visible={showOTPModal}>
          <SafeAreaView style={styles.askPaymentModal}>
            <View
              style={{
                backgroundColor: colors.white,
              }}>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={value => {
                  const otpRegex = /^\d{0,4}$/;
                  if (otpRegex.test(value)) {
                    setOTP(value);
                  } else {
                  }
                }}
                placeholder="Enter the 4 digit OTP"
                style={{
                  color: colors.black,
                  marginBottom: 32,
                  fontSize: 16,
                }}
                value={OTP}
              />
              <View style={{flexDirection: 'row'}}>
                <Button
                  disabled={OTP?.toString().length !== 4}
                  onPress={() => {
                    setLoader(true);
                    verifyOTP({OTP, tripId: tripDetail._id})
                      .then(response => {
                        setOTPVerified(true);
                        setLoader(false);
                        setShowOTPModal(false);
                      })
                      .catch(error => {
                        setOTPVerified(false);
                        setLoader(false);
                        console.log('OTP verify fail: ', error.message);
                        Alert.alert(
                          'OTP verification failed',
                          'Message: ' + error.response.data?.message ||
                            error.message,
                        );
                      });
                  }}
                  style={{
                    ...styles.askPaymentButton,
                    backgroundColor:
                      OTP?.toString().length === 4
                        ? colors.secondary
                        : colors.greyDark,
                    marginRight: 4,
                  }}
                  text={'Verify OTP'}
                  textStyle={{
                    ...styles.askPaymentButtonText,
                    color: colors.white,
                  }}
                />
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </View>
      <Loader visible={loader} />
    </>
  );
};

const styles = StyleSheet.create({
  askPaymentButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.secondary,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    flex: 1,
    padding: 8,
  },
  askPaymentButtonText: {
    color: colors.secondary,
    fontSize: 16,
    textAlign: 'center',
  },
  askPaymentModal: {
    backgroundColor: colors.white,
    padding: 12,
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 16,
    width: '95%',
  },
  cancelTripCTA: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  container: {
    backgroundColor: colors.white,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.tertiary,
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  mapView: {
    flex: 1,
  },
  chanegStatusButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 8,
    bottom: 16,
    justifyContent: 'center',
    left: 16,
    padding: 16,
    position: 'absolute',
    right: 16,
  },
  chanegStatusText: {
    color: colors.white,
    fontSize: 18,
  },
  chanegStatusTextSecondary: {
    color: colors.secondary,
    fontSize: 16,
  },
  item: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  itemsContainer: {
    flex: 1,
    marginTop: 8,
    width: '100%',
  },
  pickupItemsHeader: {
    alignItems: 'center',
    backgroundColor: colors.white,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 3,
    width: '100%',
  },
  pickupItemsHeaderText: {
    color: colors.black,
    fontSize: 18,
    fontWeight: 'bold',
  },
  pickupItemsModal: {
    backgroundColor: colors.white,
    borderRadius: 16,
    bottom: 0,
    height: '90%',
    overflow: 'hidden',
    position: 'absolute',
    width: '100%',
  },
  secondaryCTA: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.secondary,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    flex: 1,
    padding: 16,
  },
  secondaryCTAContainer: {
    alignItems: 'center',
    backgroundColor: colors.white,
    bottom: 80,
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    left: 16,
    right: 16,
  },
  subtitle: {
    color: colors.white,
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  timerTitle: {
    color: colors.secondary,
    fontSize: 20,
    textAlign: 'center',
  },
  title: {
    color: colors.white,
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  totalItems: {
    color: colors.black,
    fontSize: 22,
    fontWeight: 'bold',
    padding: 16,
    textAlign: 'right',
    width: '100%',
  },
  tripError: {
    alignItems: 'center',
    alignSelf: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    padding: 16,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  tripErrorText: {
    color: colors.red,
    fontSize: 22,
    textAlign: 'center',
  },
  waitingPaymentLoader: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});

export default OnTheRideScreen;
