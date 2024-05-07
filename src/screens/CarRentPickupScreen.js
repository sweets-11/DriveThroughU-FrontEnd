import React, {useContext, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  BackHandler,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {addHours, differenceInSeconds} from 'date-fns';
import colors from '../config/colors';
import {HeaderBackButton} from '@react-navigation/elements';
import MapView, {Marker, Polyline, PROVIDER_GOOGLE} from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Label from '../components/Label';
import {getRegionForCoordinates} from '../utils/mapUtils';
import {ReactReduxContext} from 'react-redux';
import {
  getDeliveryStatus,
  getDriverInfo,
  getTrip,
} from '../store/selectors/DriverSelector';
import Button from '../components/Button';
import Modal from '../components/Modal';
import {TouchableOpacity} from 'react-native-gesture-handler';
import PaymentScreen from './PaymentScreen';
import Loader from '../components/Loader/Loader';
import axios from 'axios';
import {AWS_BASE_URL} from '@env';
import {getToken} from '../utils/storage';
import {AUTH_TOKEN} from '../utils/otpFunctions';
import {
  didDriverAccept,
  extendRideTime,
  getDriverLocation,
  getNearByDrivers,
} from '../utils/driverFunctions';
import {ScreenNames} from '../navigation/ScreenNames';
import {DRIVER_STATUS} from '../store/reducers/DeliveryModeReducer';
import {getTripStatus, resetState} from '../store/reducers/DriverReducer';
import NumberPicker from '../components/NumberPicker';

let intervalIdDriverLocaiton = null;
let intervalIdGetTrip = null;

const CarRentPickupScreen = ({
  navigation,
  route: {
    params: {isParcelDelivery},
  },
}) => {
  const {store} = useContext(ReactReduxContext);
  const [paymentMade, setPaymentMade] = useState(
    getTrip(store.getState())?.userPaid || false,
  );
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [hoursModalVisible, setHoursModalVisible] = useState(false);
  const [remainingTime, setRemainingTime] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [polyline, setPolyline] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState(
    getDeliveryStatus(store.getState()),
  );
  const [trip, setTrip] = useState(getTrip(store.getState()));
  const [driverInfo, setDriverInfo] = useState(getDriverInfo(store.getState()));
  const [nearByDrivers, setNearByDrivers] = useState({
    drivers: [],
    didHitApi: false,
  });
  console.log('deliveryStatus: ', deliveryStatus);
  console.log('trip: ', trip);
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      setDriverInfo(getDriverInfo(state));
      setDeliveryStatus(getDeliveryStatus(state));
      setTrip(getTrip(state));
    });
    return () => {
      unsubscribe();
    };
  }, [store]);

  useEffect(() => {
    if (
      (deliveryStatus === DRIVER_STATUS.GOING_TO_PICKUP_LOCATION ||
        deliveryStatus === DRIVER_STATUS.TRIP_ACCEPTED ||
        deliveryStatus === DRIVER_STATUS.REACHED_PICKUP_LOCATION) &&
      trip &&
      !polyline &&
      driverInfo?.currentLocation
    ) {
      getToken(AUTH_TOKEN).then(token => {
        axios
          .post(
            `${AWS_BASE_URL}/directions`,
            {
              origin: `${driverInfo.currentLocation.coordinates[1]}, ${driverInfo.currentLocation.coordinates[0]}`,
              destination: `${trip.pickup_Location.latitude}, ${trip.pickup_Location.longitude}`,
            },
            {
              headers: {
                authorization: `Bearer ${token}`,
              },
            },
          )
          .then(response => {
            const newPolyline = response.data.polyline || [];
            setPolyline(
              newPolyline.filter(
                (ele, ind) =>
                  ind ===
                  newPolyline.findIndex(
                    elem =>
                      elem.latitude === ele.latitude &&
                      elem.longitude === ele.longitude,
                  ),
              ) || null,
            );
          })
          .catch(error => {
            console.log('Error in fetching directions: ', error);
            setPolyline(null);
          });
      });
    }
  }, [deliveryStatus, driverInfo, polyline, trip]);

  useEffect(() => {
    if (trip) {
      intervalIdGetTrip = setInterval(() => {
        store.dispatch(
          getTripStatus({
            tripId: trip._id,
          }),
        );
      }, 10000);
    } else if (intervalIdGetTrip) {
      clearInterval(intervalIdGetTrip);
    }

    return () => {
      if (intervalIdGetTrip) {
        clearInterval(intervalIdGetTrip);
      }
    };
  }, [store, trip]);

  useEffect(() => {
    if (
      deliveryStatus === DRIVER_STATUS.WAITING_FOR_USER_PAYMENT &&
      !paymentMade
    ) {
      setPaymentModalVisible(true);
    } else {
      setPaymentModalVisible(false);
    }
  }, [paymentMade, deliveryStatus]);

  useEffect(() => {
    const backhandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.replace(ScreenNames.HOME_SCREEN);
      },
    );
    navigation.setOptions({
      headerLeft: props => (
        <HeaderBackButton
          {...props}
          onPress={() => {
            store.dispatch(resetState());
            navigation.pop(3);
          }}
        />
      ),
      headerTitle: `Car rent - Picking you up`,
    });
    return () => {
      if (backhandler) backhandler.remove();
    };
  }, [navigation, store, trip]);

  useEffect(() => {
    if (!driverInfo && trip) {
      didDriverAccept({
        store,
        tripId: trip._id,
        shouldUpdateTripStatus:
          deliveryStatus === DRIVER_STATUS.FINDING_DRIVERS ||
          deliveryStatus === DRIVER_STATUS.GOING_TO_PICKUP_LOCATION ||
          deliveryStatus === DRIVER_STATUS.WAITING_FOR_A_DRIVER_TO_ACCEPT ||
          deliveryStatus === DRIVER_STATUS.TRIP_ACCEPTED,
      });
    }
  }, [deliveryStatus, driverInfo, store, trip]);

  useEffect(() => {
    let interval = null;
    if (
      deliveryStatus === DRIVER_STATUS.RIDE_STARTED &&
      trip?.carRentTripCreatedAt
    ) {
      interval = setInterval(() => {
        const seconds = differenceInSeconds(
          addHours(trip.carRentTripCreatedAt, trip.totalHour),
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
  }, [deliveryStatus, trip?.totalHour, trip?.carRentTripCreatedAt]);

  useEffect(() => {
    if (
      (deliveryStatus === DRIVER_STATUS.TRIP_ACCEPTED ||
        deliveryStatus === DRIVER_STATUS.GOING_TO_PICKUP_LOCATION) &&
      polyline?.length > 1 &&
      trip
    ) {
      console.log('starting interval: ', intervalIdDriverLocaiton);
      intervalIdDriverLocaiton = setInterval(() => {
        getDriverLocation({
          polyline,
          setPolyline,
          store,
          tripId: trip._id,
        });
      }, 1000);
    } else if (intervalIdDriverLocaiton && polyline?.length <= 1) {
      console.log('clearing interval else condition');
      clearInterval(intervalIdDriverLocaiton);
    }

    return () => {
      if (intervalIdDriverLocaiton) {
        console.log('clearing interval return statement');
        clearInterval(intervalIdDriverLocaiton);
      }
    };
  }, [deliveryStatus, polyline, store, trip]);

  useEffect(() => {
    if (
      !nearByDrivers.drivers.length &&
      !nearByDrivers.didHitApi &&
      (deliveryStatus === DRIVER_STATUS.FINDING_DRIVERS ||
        deliveryStatus === DRIVER_STATUS.WAITING_FOR_A_DRIVER_TO_ACCEPT) &&
      trip
    ) {
      getNearByDrivers({
        location: {
          latitude: trip.pickup_Location.latitude,
          longitude: trip.pickup_Location.longitude,
        },
        tripId: trip._id,
      })
        .then(response => {
          setNearByDrivers({drivers: response.drivers, didHitApi: true});
          setTimeout(
            () =>
              setNearByDrivers({drivers: response.drivers, didHitApi: false}),
            5000,
          );
        })
        .catch(error => {
          console.log('error in getting driver: ', error);
          setTimeout(
            () =>
              setNearByDrivers(prevValue => ({
                drivers: prevValue.drivers,
                didHitApi: false,
              })),
            5000,
          );
        });
    }
  }, [deliveryStatus, nearByDrivers, trip]);

  const ItemDescription = ({item, price, total}) => {
    return (
      <View style={{...styles.itemContainer, marginTop: total ? 16 : 0}}>
        <Label
          text={item}
          textStyle={total ? styles.itemTotal : styles.itemText}
        />
        <Label
          text={price}
          textStyle={total ? styles.itemTotal : styles.itemText}
        />
      </View>
    );
  };

  const orderOrParcel = useMemo(
    () => (isParcelDelivery ? 'mail' : 'order'),
    [isParcelDelivery],
  );

  const status = useMemo(
    () =>
      deliveryStatus === DRIVER_STATUS.FINDING_DRIVERS
        ? 'Finding a driver for you'
        : deliveryStatus === DRIVER_STATUS.WAITING_FOR_A_DRIVER_TO_ACCEPT
        ? `Waiting for a driver to accept your request`
        : deliveryStatus === DRIVER_STATUS.GOING_TO_PICKUP_LOCATION ||
          deliveryStatus === DRIVER_STATUS.TRIP_ACCEPTED
        ? `Agent is coming to pick you up`
        : deliveryStatus === DRIVER_STATUS.REACHED_PICKUP_LOCATION
        ? `Agent has reached your pickup location!\n${
            trip?.didDriverVerifyOtp
              ? 'Verified! Waiting for agent to start the ride'
              : 'Please tell the OTP to our agent.'
          }`
        : deliveryStatus === DRIVER_STATUS.RIDE_STARTED
        ? 'Enjoy your ride!'
        : deliveryStatus === DRIVER_STATUS.WAITING_FOR_USER_PAYMENT
        ? trip.userPaid
          ? 'We are checking your payment'
          : 'Driver is waiting for your payment'
        : deliveryStatus === DRIVER_STATUS.RIDE_COMPLETED
        ? 'Hope you enjoyed the ride!!'
        : 'Agent status unknown',
    [deliveryStatus, trip],
  );

  return trip ? (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Label text={status} textStyle={styles.deliveryTitle} />
          <View style={styles.subHeader}>
            <Label
              text={
                'Booking time: ' +
                (trip.totalHour || trip.bookingHours) +
                (Number(trip.totalHour || trip.bookingHours) === 1
                  ? ' hour'
                  : ' hours')
              }
              textStyle={styles.subHeaderText}
            />
            <MaterialCommunityIcons
              name="clock-outline"
              color={colors.white}
              size={18}
            />
            {deliveryStatus !== DRIVER_STATUS.RIDE_COMPLETED ? (
              <Label
                text={'OTP: ' + trip.otp}
                textStyle={{
                  ...styles.subHeaderText,
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginRight: 0,
                  marginLeft: 8,
                }}
              />
            ) : null}
          </View>
          {deliveryStatus !== DRIVER_STATUS.FINDING_DRIVERS &&
          deliveryStatus !== DRIVER_STATUS.WAITING_FOR_A_DRIVER_TO_ACCEPT ? (
            <View style={styles.agentInfo}>
              <Text>
                <Label text={'Driver: '} textStyle={styles.deliveryInfo} />
                <Label
                  text={driverInfo?.name || 'Please wait...'}
                  textStyle={{...styles.deliveryInfo, fontWeight: 'bold'}}
                />
              </Text>
              <Text>
                <Label
                  text={'Vehicle number plate: '}
                  textStyle={styles.deliveryInfo}
                />
                <Label
                  text={driverInfo?.vehicleNumber || 'Please wait...'}
                  textStyle={{
                    ...styles.deliveryInfo,
                    fontWeight: 'bold',
                  }}
                />
              </Text>
            </View>
          ) : null}
        </View>
        <>
          {!(
            deliveryStatus === DRIVER_STATUS.RIDE_STARTED ||
            deliveryStatus === DRIVER_STATUS.WAITING_FOR_USER_PAYMENT ||
            deliveryStatus === DRIVER_STATUS.RIDE_COMPLETED
          ) ? (
            <MapView
              loadingEnabled={false}
              provider={PROVIDER_GOOGLE}
              region={{
                ...getRegionForCoordinates([
                  {
                    latitude: trip.pickup_Location.latitude,
                    longitude: trip.pickup_Location.longitude,
                  },
                  driverInfo?.currentLocation
                    ? {
                        latitude: driverInfo.currentLocation.coordinates[1],
                        longitude: driverInfo.currentLocation.coordinates[0],
                      }
                    : null,
                  ...(deliveryStatus ===
                    DRIVER_STATUS.WAITING_FOR_A_DRIVER_TO_ACCEPT ||
                  deliveryStatus === DRIVER_STATUS.FINDING_DRIVERS
                    ? nearByDrivers.drivers || []
                    : []
                  ).map(({currentLocation}) => ({
                    latitude: currentLocation.coordinates[1],
                    longitude: currentLocation.coordinates[0],
                  })),
                ]),
              }}
              showsUserLocation={false}
              showsPointsOfInterest={false}
              moveOnMarkerPress={false}
              showsMyLocationButton={false}
              zoomEnabled={true}
              scrollEnabled={true}
              style={styles.mapView}>
              <Marker
                title={'Pickup location'}
                coordinate={{
                  latitude: trip.pickup_Location.latitude,
                  longitude: trip.pickup_Location.longitude,
                }}>
                <MaterialCommunityIcons
                  name="pin"
                  color={colors.greyDark}
                  size={44}
                />
              </Marker>
              {(deliveryStatus === DRIVER_STATUS.TRIP_ACCEPTED ||
                deliveryStatus === DRIVER_STATUS.GOING_TO_PICKUP_LOCATION ||
                deliveryStatus === DRIVER_STATUS.REACHED_PICKUP_LOCATION) &&
              driverInfo?.currentLocation?.coordinates?.length ? (
                <Marker
                  title={'Delivery partner'}
                  coordinate={{
                    latitude: driverInfo.currentLocation.coordinates[1],
                    longitude: driverInfo.currentLocation.coordinates[0],
                  }}>
                  <MaterialCommunityIcons
                    name="car-side"
                    color={colors.secondary}
                    size={44}
                  />
                </Marker>
              ) : deliveryStatus === DRIVER_STATUS.FINDING_DRIVERS ||
                deliveryStatus ===
                  DRIVER_STATUS.WAITING_FOR_A_DRIVER_TO_ACCEPT ? (
                nearByDrivers.drivers.map(({name, currentLocation}, index) => (
                  <Marker
                    key={index}
                    coordinate={{
                      latitude: currentLocation.coordinates[1],
                      longitude: currentLocation.coordinates[0],
                    }}
                    title={name}>
                    <MaterialCommunityIcons
                      name="car-side"
                      color={colors.secondary}
                      size={44}
                    />
                  </Marker>
                ))
              ) : null}
              {polyline?.length > 1 &&
              (deliveryStatus === DRIVER_STATUS.TRIP_ACCEPTED ||
                deliveryStatus === DRIVER_STATUS.GOING_TO_PICKUP_LOCATION ||
                deliveryStatus === DRIVER_STATUS.REACHED_DELIVERY_LOCATION) ? (
                <Polyline
                  coordinates={polyline}
                  strokeColor={colors.black}
                  strokeWidth={6}
                />
              ) : null}
            </MapView>
          ) : (
            <View
              style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
              {deliveryStatus === DRIVER_STATUS.RIDE_COMPLETED ? (
                <Label
                  text={'Thank you for riding with us!'}
                  textStyle={styles.timerTitle}
                />
              ) : (
                <>
                  <Label
                    text={'Enjoy your ride!!\nYour remaining trip time is: '}
                    textStyle={styles.timerTitle}
                  />
                  <Label
                    text={`${
                      remainingTime.hours ? remainingTime.hours + ' hours ' : ''
                    } ${
                      remainingTime.minutes
                        ? remainingTime.minutes + ' minutes '
                        : ''
                    }${remainingTime.seconds + ' seconds'}`}
                    textStyle={{...styles.timerTitle, fontWeight: 'bold'}}
                  />
                  {remainingTime.hours === 0 &&
                  remainingTime.minutes <= 10 &&
                  deliveryStatus === DRIVER_STATUS.RIDE_STARTED ? (
                    <Button
                      style={styles.extendRideButton}
                      text={'Want to extend your ride?'}
                      textStyle={styles.extendRide}
                      onPress={() => setHoursModalVisible(true)}
                    />
                  ) : null}
                </>
              )}
            </View>
          )}
          {!paymentMade &&
          deliveryStatus === DRIVER_STATUS.WAITING_FOR_USER_PAYMENT ? (
            <Button
              onPress={() => setPaymentModalVisible(true)}
              style={{
                ...styles.cancelButton,
                bottom: 16,
              }}
              text={'Make payment to end the ride'}
              textStyle={styles.cancelButtonText}
            />
          ) : null}
          {deliveryStatus === DRIVER_STATUS.RIDE_COMPLETED ? (
            <Button
              onPress={() => {
                if (intervalIdGetTrip) {
                  clearInterval(intervalIdGetTrip);
                }
                store.dispatch(resetState());
                navigation.pop(3);
              }}
              style={styles.cancelButton}
              text={'Home'}
              textStyle={styles.cancelButtonText}
            />
          ) : null}
        </>
        <Modal
          animationType="slide"
          onModalClose={() => setPaymentModalVisible(false)}
          hasBackdrop={true}
          onBackdropPress={() => setPaymentModalVisible(false)}
          visible={paymentModalVisible}>
          <SafeAreaView style={styles.paymentModal}>
            <View style={styles.paymentHeader}>
              <Label text={'Checkout'} textStyle={styles.paymentHeaderText} />
              <TouchableOpacity
                onPress={() => {
                  console.log('close');
                  setPaymentModalVisible(false);
                }}>
                <MaterialCommunityIcons
                  name="close-circle-outline"
                  color={colors.black}
                  size={28}
                />
              </TouchableOpacity>
            </View>
            {trip?.Fare ? (
              <>
                <ScrollView style={styles.paymentBreakDownContainer}>
                  {trip.Fare?.deliveryCharges ? (
                    <>
                      <ItemDescription
                        item={'Hourly charges'}
                        price={trip.Fare.deliveryCharges.X?.toFixed(2)}
                      />
                      <ItemDescription
                        item={'Tax'}
                        price={trip.Fare.deliveryCharges.Z.toFixed(2)}
                      />
                      <ItemDescription
                        item={'Total'}
                        price={`$${Number(
                          trip.Fare.deliveryCharges.totalFare,
                        ).toFixed(2)}`}
                        total={true}
                      />
                    </>
                  ) : null}
                </ScrollView>
                <PaymentScreen
                  amount={trip.Fare}
                  setPaymentMade={setPaymentMade}
                  style={styles.paymentButton}
                  tripId={trip._id}
                />
              </>
            ) : null}
          </SafeAreaView>
        </Modal>
        <NumberPicker
          onModalClose={() => setHoursModalVisible(false)}
          setValue={hours =>
            Alert.alert(
              'Extend ride time!',
              `Are you sure you want to extend ride time by ${hours[0]} hours?`,
              [
                {
                  isPreferred: true,
                  onPress: () =>
                    extendRideTime({extraHour: hours[0], tripId: trip._id})
                      .then(response => {
                        if (response.data.success)
                          Alert.alert(
                            'Time extended!',
                            `Your ride has been extended by ${hours[0]} hours!`,
                          );
                      })
                      .catch(error => {
                        Alert.alert(
                          'Time extension failed!',
                          `Ride time extension failed due to: ${error.message}!`,
                        );
                      }),
                  text: 'Yes',
                },
                {
                  isPreferred: false,
                  onPress: () => {},
                  text: 'No',
                },
              ],
            )
          }
          value={0}
          visible={hoursModalVisible}
        />
      </View>
    </>
  ) : (
    <Loader text="Fetching your trip" visible={true} from="CarRentScreen" />
  );
};

const styles = StyleSheet.create({
  agentInfo: {
    alignItems: 'flex-start',
    backgroundColor: colors.secondary,
    borderRadius: 8,
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    bottom: 16,
    justifyContent: 'center',
    left: 16,
    padding: 16,
    position: 'absolute',
    right: 16,
  },
  cancelButtonText: {
    color: colors.white,
    fontSize: 18,
  },
  container: {
    backgroundColor: colors.white,
    flex: 1,
  },
  deliveryInfo: {
    color: colors.white,
    fontSize: 16,
  },
  deliveryTitle: {
    alignSelf: 'center',
    color: colors.white,
    fontSize: 18,
  },
  extendRide: {
    color: colors.white,
    fontSize: 16,
  },
  extendRideButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.tertiary,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  itemContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemText: {
    color: colors.black,
    fontSize: 18,
  },
  itemTotal: {
    color: colors.black,
    fontSize: 20,
    fontWeight: 'bold',
  },
  mapView: {
    flex: 1,
  },
  paymentBreakDownContainer: {
    padding: 16,
  },
  paymentButton: {
    bottom: 32,
    position: 'absolute',
    width: '100%',
  },
  paymentHeader: {
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
    zIndex: 1,
  },
  paymentHeaderText: {
    color: colors.black,
    fontSize: 18,
  },
  paymentModal: {
    backgroundColor: colors.white,
    bottom: 0,
    height: '50%',
    position: 'absolute',
    width: '100%',
  },
  searchingText: {
    alignSelf: 'center',
    color: colors.black,
    fontSize: 18,
  },
  subHeader: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    padding: 8,
  },
  subHeaderText: {
    color: colors.white,
    fontSize: 16,
    marginRight: 8,
  },
  timerTitle: {
    color: colors.secondary,
    fontSize: 20,
    textAlign: 'center',
  },
});

export default CarRentPickupScreen;
