import React, {useContext, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import colors from '../config/colors';
import {HeaderBackButton} from '@react-navigation/elements';
import MapView, {Marker, Polyline, PROVIDER_GOOGLE} from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Label from '../components/Label';
import {
  calculateHeading,
  getCurvedPolylinePoints,
  getRegionForCoordinates,
} from '../utils/mapUtils';
import {ReactReduxContext} from 'react-redux';
import {
  getDeliveryStatus,
  getDriverInfo,
  getDrivers,
  getTrip,
} from '../store/selectors/DriverSelector';
import Button from '../components/Button';
import Modal from '../components/Modal';
import {TouchableOpacity} from 'react-native-gesture-handler';
import PaymentScreen from './PaymentScreen';
import Loader from '../components/Loader/Loader';
/* import {
  getLocationUpdate,
  getSocketConnecting,
} from '../store/selectors/SocketSelector';
import {
  createConnection,
  disconnectSocket,
  sendData,
} from '../store/reducers/SocketReducer'; */
import axios from 'axios';
import {AWS_BASE_URL} from '@env';
import {getToken} from '../utils/storage';
import {AUTH_TOKEN} from '../utils/otpFunctions';
import {getSelectedAddress} from '../store/selectors/AddressSelectors';
import {
  didDriverAccept,
  didDriverStartDelivery,
  getDriverLocation,
} from '../utils/driverFunctions';
import {ScreenNames} from '../navigation/ScreenNames';
import {DRIVER_STATUS} from '../store/reducers/DeliveryModeReducer';
import {getTripStatus, resetState} from '../store/reducers/DriverReducer';

let intervalIdDriverLocaiton = null;
let intervalIdGetTrip = null;

const DeliveryScreen = ({
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
  /*  const [socketConnecting, setSocketConnecting] = useState(false); */
  const [selectedAddress, setSelectedAddress] = useState(
    getSelectedAddress(store.getState()),
  );
  const [polyline, setPolyline] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState(
    getDeliveryStatus(store.getState()),
  );
  const [trip, setTrip] = useState(getTrip(store.getState()));
  const [driverInfo, setDriverInfo] = useState(getDriverInfo(store.getState()));
  const [waitingForDriversToAccept, setWaitingForDriversToAccept] = useState(
    getDrivers(store.getState()),
  );

  console.log('deliveryStatus: ', deliveryStatus);
  console.log('trip: ', trip);
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      /*  setSocketConnecting(getSocketConnecting(state)); */
      setDriverInfo(getDriverInfo(state));
      setSelectedAddress(getSelectedAddress(state));
      setWaitingForDriversToAccept(getDrivers(state));
      setDeliveryStatus(getDeliveryStatus(state));
      setTrip(getTrip(state));
    });
    /* setTimeout(() => store.dispatch(createConnection())); */
    return () => {
      unsubscribe();
      /*  store.dispatch(disconnectSocket()); */
    };
  }, [store]);

  useEffect(() => {
    if (
      deliveryStatus === DRIVER_STATUS.GOING_TO_DELIVERY_LOCATION &&
      paymentMade &&
      trip &&
      !polyline
    ) {
      getToken(AUTH_TOKEN).then(token => {
        axios
          .post(
            `${AWS_BASE_URL}/directions`,
            {
              origin: `${trip.pickup_Location.latitude}, ${trip.pickup_Location.longitude}`,
              destination: `${trip.dropoff_Location.latitude}, ${trip.dropoff_Location.longitude}`,
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
  }, [deliveryStatus, paymentMade, polyline, trip]);

  useEffect(() => {
    if (trip) {
      intervalIdGetTrip = setInterval(() => {
        store.dispatch(
          getTripStatus({
            tripId: trip._id,
          }),
        );
      }, 1000);
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
      headerTitle: `Delivery from - ${trip?.pickup_Location.address_name}`,
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
    let intervalId = null;
    if (
      (deliveryStatus === DRIVER_STATUS.GOING_TO_PICKUP_LOCATION ||
        deliveryStatus === DRIVER_STATUS.PICKING_ITEMS) &&
      trip
    ) {
      intervalId = setInterval(() => {
        didDriverStartDelivery({
          intervalId,
          store,
          tripId: trip._id,
        });
      }, 1000);
    } else if (intervalId) {
      clearInterval(intervalId);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [deliveryStatus, store, trip]);

  useEffect(() => {
    if (
      deliveryStatus === DRIVER_STATUS.GOING_TO_DELIVERY_LOCATION &&
      polyline?.length > 1 &&
      paymentMade &&
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
  }, [deliveryStatus, paymentMade, polyline, store, trip]);

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
        ? 'Finding a delivery agent'
        : deliveryStatus === DRIVER_STATUS.WAITING_FOR_A_DRIVER_TO_ACCEPT
        ? `Waiting for an agent to accept your ${orderOrParcel}`
        : deliveryStatus === DRIVER_STATUS.GOING_TO_PICKUP_LOCATION ||
          deliveryStatus === DRIVER_STATUS.TRIP_ACCEPTED
        ? `Agent is going to pickup your ${orderOrParcel}`
        : deliveryStatus === DRIVER_STATUS.REACHED_PICKUP_LOCATION
        ? 'Agent has reached the pickup location!'
        : deliveryStatus === DRIVER_STATUS.PICKING_ITEMS
        ? `Agent is picking your ${orderOrParcel}`
        : deliveryStatus === DRIVER_STATUS.WAITING_FOR_USER_PAYMENT
        ? trip.userPaid
          ? 'We are checking your payment'
          : 'Agent is waiting for your payment'
        : deliveryStatus === DRIVER_STATUS.GOING_TO_DELIVERY_LOCATION
        ? 'Delivery agent is on the way'
        : (deliveryStatus === DRIVER_STATUS.GOING_TO_DELIVERY_LOCATION &&
            polyline?.length <= 1) ||
          deliveryStatus === DRIVER_STATUS.REACHED_DELIVERY_LOCATION
        ? 'Delivery agent has reached!'
        : deliveryStatus === DRIVER_STATUS.DELIVERED
        ? `Your ${orderOrParcel} has been delivered!`
        : 'Agent status unknown',
    [deliveryStatus, orderOrParcel, polyline, trip],
  );

  const curvedPolyline = useMemo(
    () =>
      trip
        ? getCurvedPolylinePoints([
            {
              latitude: trip.pickup_Location.latitude,
              longitude: trip.pickup_Location.longitude,
            },
            {
              latitude: trip.dropoff_Location.latitude,
              longitude: trip.dropoff_Location.longitude,
            },
          ])
        : [],
    [trip],
  );
  return trip ? (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Label text={status} textStyle={styles.deliveryTitle} />
          <View style={styles.subHeader}>
            <Label
              text={trip.pickupToDropoff.time}
              textStyle={styles.subHeaderText}
            />
            <MaterialCommunityIcons
              name="clock-outline"
              color={colors.white}
              size={18}
            />
            <Label
              text={trip.pickupToDropoff.distance}
              textStyle={{
                ...styles.subHeaderText,
                marginRight: 0,
                marginLeft: 8,
              }}
            />
          </View>
          {deliveryStatus === DRIVER_STATUS.GOING_TO_PICKUP_LOCATION ? (
            <View style={styles.agentInfo}>
              <Text>
                <Label
                  text={'Delivery agent: '}
                  textStyle={styles.deliveryInfo}
                />
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
        {
          /* deliveryStatus === DRIVER_STATUS.FINDING_DRIVERS && !polyline  */ false ? (
            <View
              style={{
                alignItems: 'center',
                backgroundColor: '#0005',
                flex: 0.5,
                justifyContent: 'center',
                marginTop: 16,
              }}>
              <ActivityIndicator size={60} color="#FFF" />
              <Label
                text={'Searching for nearby agents'}
                textStyle={styles.searchingText}
              />
            </View>
          ) : (
            <>
              <MapView
                loadingEnabled={false}
                provider={PROVIDER_GOOGLE}
                region={{
                  ...getRegionForCoordinates([
                    {
                      latitude: trip.dropoff_Location.latitude,
                      longitude: trip.dropoff_Location.longitude,
                    },
                    {
                      latitude: polyline?.length
                        ? polyline[0].latitude
                        : trip.pickup_Location.latitude,
                      longitude: polyline?.length
                        ? polyline[0].longitude
                        : trip.pickup_Location.longitude,
                    },
                    ...(polyline || []),
                    deliveryStatus ===
                      DRIVER_STATUS.GOING_TO_DELIVERY_LOCATION &&
                    driverInfo?.currentLocation
                      ? {
                          latitude: driverInfo.currentLocation.coordinates[1],
                          longitude: driverInfo.currentLocation.coordinates[0],
                        }
                      : null,
                    ...(deliveryStatus ===
                    DRIVER_STATUS.WAITING_FOR_A_DRIVER_TO_ACCEPT
                      ? waitingForDriversToAccept || []
                      : []
                    ).map(({location}) => ({
                      latitude: location.latitude,
                      longitude: location.longitude,
                    })),
                  ]),
                }}
                showsUserLocation={false}
                showsPointsOfInterest={false}
                moveOnMarkerPress={false}
                showsMyLocationButton={false}
                zoomEnabled={false}
                scrollEnabled={false}
                style={styles.mapView}>
                {(deliveryStatus === DRIVER_STATUS.GOING_TO_DELIVERY_LOCATION ||
                  deliveryStatus === DRIVER_STATUS.REACHED_DELIVERY_LOCATION ||
                  deliveryStatus === DRIVER_STATUS.DELIVERED) &&
                driverInfo?.currentLocation?.coordinates?.length ? (
                  <Marker
                    title={'Delivery partner'}
                    coordinate={{
                      latitude: driverInfo.currentLocation.coordinates[1],
                      longitude: driverInfo.currentLocation.coordinates[0],
                    }}
                    /*  rotation={
                        polyline
                          ? calculateHeading(
                              polyline?.[0],
                              polyline?.[1] || {
                                latitude:
                                  driverInfo.currentLocation.coordinates[1],
                                longitude:
                                  driverInfo.currentLocation.coordinates[0],
                              },
                            )
                          : 0
                      } */
                  >
                    <View style={styles.avatarContainer}>
                      <Image
                        source={require('../assets/images/avatar.png')}
                        style={{height: 44, width: 44}}
                      />
                    </View>
                  </Marker>
                ) : /* waitingForDriversToAccept.length */ deliveryStatus ===
                    DRIVER_STATUS.FINDING_DRIVERS ||
                  deliveryStatus ===
                    DRIVER_STATUS.WAITING_FOR_A_DRIVER_TO_ACCEPT ||
                  deliveryStatus === DRIVER_STATUS.GOING_TO_PICKUP_LOCATION ||
                  deliveryStatus === DRIVER_STATUS.REACHED_PICKUP_LOCATION ||
                  deliveryStatus === DRIVER_STATUS.PICKING_ITEMS ? (
                  <>
                    <Marker
                      title={
                        trip.type?.toLowerCase()?.includes('grocery')
                          ? trip.pickup_Location.address_name
                          : 'Pickup location'
                      }
                      coordinate={{
                        latitude: trip.pickup_Location.latitude,
                        longitude: trip.pickup_Location.longitude,
                      }}>
                      <MaterialCommunityIcons
                        name="store"
                        color={colors.greyDark}
                        size={44}
                      />
                    </Marker>
                    {waitingForDriversToAccept.map(
                      ({name, location}, index) => (
                        <Marker
                          key={index}
                          coordinate={{
                            latitude: location.latitude,
                            longitude: location.longitude,
                          }}
                          title={name}>
                          <View style={styles.avatarContainer}>
                            <Image
                              source={require('../assets/images/avatarIdle.png')}
                              style={{height: 35, width: 35}}
                            />
                          </View>
                        </Marker>
                      ),
                    )}
                  </>
                ) : null}
                <Marker
                  title={
                    trip.type?.toLowerCase()?.includes('grocery')
                      ? 'Destination'
                      : 'Drop off location'
                  }
                  coordinate={{
                    latitude: trip.dropoff_Location.latitude,
                    longitude: trip.dropoff_Location.longitude,
                  }}>
                  <MaterialCommunityIcons
                    name="map-marker-radius"
                    color={colors.secondary}
                    size={44}
                  />
                </Marker>
                {polyline?.length > 1 &&
                deliveryStatus === DRIVER_STATUS.GOING_TO_DELIVERY_LOCATION ? (
                  <Polyline
                    coordinates={polyline}
                    strokeColor={colors.black}
                    strokeWidth={6}
                  />
                ) : deliveryStatus === DRIVER_STATUS.FINDING_DRIVERS ||
                  deliveryStatus === DRIVER_STATUS.TRIP_ACCEPTED ||
                  deliveryStatus ===
                    DRIVER_STATUS.WAITING_FOR_A_DRIVER_TO_ACCEPT ||
                  deliveryStatus === DRIVER_STATUS.GOING_TO_PICKUP_LOCATION ||
                  deliveryStatus === DRIVER_STATUS.PICKING_ITEMS ||
                  deliveryStatus === DRIVER_STATUS.WAITING_FOR_USER_PAYMENT ? (
                  <>
                    <Polyline
                      coordinates={curvedPolyline}
                      geodesic={true}
                      strokeColor={colors.black}
                      strokeWidth={6}
                      strokeColors={curvedPolyline.map((point, index) =>
                        index % 3 === 0 ? colors.black : '#FFF0',
                      )}
                    />
                    <Polyline
                      coordinates={[
                        {
                          latitude: trip.pickup_Location.latitude,
                          longitude: trip.pickup_Location.longitude,
                        },
                        {
                          latitude: trip.dropoff_Location.latitude,
                          longitude: trip.dropoff_Location.longitude,
                        },
                      ]}
                      geodesic={true}
                      strokeColor={colors.neutralGrey}
                      strokeWidth={6}
                    />
                  </>
                ) : null}
              </MapView>
              {!paymentMade &&
              deliveryStatus === DRIVER_STATUS.WAITING_FOR_USER_PAYMENT ? (
                <Button
                  onPress={() => setPaymentModalVisible(true)}
                  style={{
                    ...styles.cancelButton,
                    bottom: 16,
                  }}
                  text={'Make payment to start delivery'}
                  textStyle={styles.cancelButtonText}
                />
              ) : null}
              {deliveryStatus === DRIVER_STATUS.DELIVERED ? (
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
          )
        }
        <Modal
          animationType="slide"
          onModalClose={() => setPaymentModalVisible(false)}
          hasBackdrop={true}
          onBackdropPress={() => setPaymentModalVisible(false)}
          visible={paymentModalVisible}>
          <SafeAreaView style={styles.paymentModal}>
            <View style={styles.paymentHeader}>
              <Label text={'Checkout'} textStyle={styles.paymentHeaderText} />
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <MaterialCommunityIcons
                  name="close-circle-outline"
                  color={colors.black}
                  size={28}
                />
              </TouchableOpacity>
            </View>
            {trip.Fare ? (
              <>
                <ScrollView style={styles.paymentBreakDownContainer}>
                  {isParcelDelivery ? null : (
                    <ItemDescription
                      item={"Items' bill"}
                      price={`$${trip.Fare.itemsBill}`}
                    />
                  )}
                  {trip.Fare?.deliveryCharges ? (
                    <>
                      <ItemDescription
                        item={'Distance charges'}
                        price={trip.Fare.deliveryCharges.X?.toFixed(2)}
                      />
                      <ItemDescription
                        item={'Delivery charges'}
                        price={trip.Fare.deliveryCharges.Y.toFixed(2)}
                      />
                      <ItemDescription
                        item={'Tax'}
                        price={trip.Fare.deliveryCharges.Z.toFixed(2)}
                      />
                      <ItemDescription
                        item={'Total'}
                        price={`$${Number(
                          trip.Fare.itemsBill +
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
      </View>
      {/*  <Loader visible={socketConnecting} /> */}
    </>
  ) : (
    <Loader text="Fetching your trip" visible={true} from="DeliveryScreen" />
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
  avatarContainer: {
    backgroundColor: colors.greyLight,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: 100,
    overflow: 'hidden',
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
    fontSize: 18,
  },
  deliveryTitle: {
    alignSelf: 'center',
    color: colors.white,
    fontSize: 24,
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
});

export default DeliveryScreen;
