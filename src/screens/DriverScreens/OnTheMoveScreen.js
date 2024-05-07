import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  AppState,
  Image,
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
  updateLocation,
} from '../../store/reducers/DeliveryModeReducer';
import {
  getDriverStatus,
  getLocation,
} from '../../store/selectors/DeliveryModeSelectors';
import Modal from '../../components/Modal';
import CheckBox from '@react-native-community/checkbox';
import {didUserPay, modifyPolyline} from '../../utils/driverFunctions';
import {startBgTask, stopBgTask} from '../../utils/backgroundTask';
import Geolocation from '@react-native-community/geolocation';
import {getLocationPermission} from '../../utils/locationPermission';
import {getGeolocation} from '../../utils/getGeolocation';

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

const OnTheMoveScreen = ({
  navigation,
  route: {
    params: {tripDetail},
  },
}) => {
  const {store} = useContext(ReactReduxContext);
  const appState = useRef(AppState.currentState);
  const [polyline, setPolyline] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState(
    getDriverStatus(store.getState()),
  );
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [showUserPaymentModal, setShowUserPaymentModal] = useState(false);
  const [userPaid, setUserPaid] = useState(tripDetail.userPaid);
  const [collected, setCollected] = useState({});
  const [location, setLocation] = useState(getLocation(store.getState()));
  const [amountToPay, setAmountToPay] = useState(0);
  const [correctAmount, setCorrectAmount] = useState(true);
  const [locationPermission, setLocationPermission] = useState(false);

  const pickupLocation = useMemo(
    () =>
      tripDetail.type?.includes('Grocery')
        ? {
            latitude: tripDetail.shopInfo.geometry.location.lat,
            longitude: tripDetail.shopInfo.geometry.location.lng,
          }
        : {
            latitude: tripDetail.pickup_Location.latitude,
            longitude: tripDetail.pickup_Location.longitude,
          },
    [tripDetail],
  );

  const deliveryLocation = useMemo(
    () => ({
      ...({
        latitude: tripDetail?.dropoff_Location.latitude,
        longitude: tripDetail?.dropoff_Location.longitude,
      } || {
        latitude: '0.0',
        longitude: '0.0',
      }),
    }),
    [tripDetail],
  );

  const deliveryFlow = useMemo(() => {
    switch (deliveryStatus) {
      case DRIVER_STATUS.GOING_TO_PICKUP_LOCATION:
      case DRIVER_STATUS.PICKING_ITEMS:
      case DRIVER_STATUS.TRIP_ACCEPTED:
      case DRIVER_STATUS.REACHED_PICKUP_LOCATION:
        return 0;
      case DRIVER_STATUS.GOING_TO_DELIVERY_LOCATION:
      case DRIVER_STATUS.REACHED_DELIVERY_LOCATION:
      case DRIVER_STATUS.DELIVERED:
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
            getGeolocation(locationPermission)
              .then(info => {
                store.dispatch(
                  updateLocation({
                    location: {
                      latitude: info?.coords?.latitude,
                      longitude: info?.coords.longitude,
                    },
                  }),
                );
              })
              .catch(error => {
                console.log('Error in getting location: ', error);
              });
          }
        }, 10000);
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
    let ODPair = {
      origin: `${location.latitude}, ${location.longitude}`,
      destination: `${pickupLocation.latitude}, ${pickupLocation.longitude}`,
    };
    if (deliveryFlow == 1) {
      ODPair = {
        origin: `${location.latitude}, ${location.longitude}`,
        destination: `${deliveryLocation.latitude}, ${deliveryLocation.longitude}`,
      };
    } else {
      ODPair = {
        origin: `${location.latitude}, ${location.longitude}`,
        destination: `${pickupLocation.latitude}, ${pickupLocation.longitude}`,
      };
    }
    getDirections({...ODPair, setPolyline});
  }, [pickupLocation, deliveryFlow, deliveryLocation, location]);

  useEffect(() => {
    let titleSuffix = 'Picking up Items';
    switch (deliveryStatus) {
      case DRIVER_STATUS.GOING_TO_PICKUP_LOCATION:
      case DRIVER_STATUS.PICKING_ITEMS:
      case DRIVER_STATUS.REACHED_PICKUP_LOCATION:
      case DRIVER_STATUS.TRIP_ACCEPTED:
        titleSuffix = 'Picking up Items';
        break;
      case DRIVER_STATUS.GOING_TO_DELIVERY_LOCATION:
      case DRIVER_STATUS.REACHED_DELIVERY_LOCATION:
        titleSuffix = 'Delivering';
        break;
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
      headerTitle: `On the move - ${titleSuffix}`,
      /* headerRight: () => {
        return (
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={() => {
              Alert.alert(
                'Cancel trip',
                'Are you sure to cancel trip? You might not get any payment for this if you proceed.',
                [
                  {
                    isPreferred: true,
                    text: 'Continue trip',
                    style: 'default',
                    onPress: () => {},
                  },
                  {
                    text: 'Cancel trip',
                    style: 'destructive',
                    onPress: () => {
                      navigation.goBack();
                    },
                  },
                ],
              );
            }}
            style={styles.cancelTripCTA}>
            <MaterialCommunityIcons
              color={colors.red}
              name={'cancel'}
              size={32}
            />
          </TouchableOpacity>
        );
      } */
    });
  }, [deliveryStatus, navigation]);

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
      case DRIVER_STATUS.PICKING_ITEMS:
      case DRIVER_STATUS.WAITING_FOR_USER_PAYMENT:
        store.dispatch(
          setDriverStatus({
            driverStatus: DRIVER_STATUS.GOING_TO_DELIVERY_LOCATION,
            tripId: tripDetail._id,
          }),
        );
        break;
      case DRIVER_STATUS.GOING_TO_DELIVERY_LOCATION:
        store.dispatch(
          setDriverStatus({
            driverStatus: DRIVER_STATUS.REACHED_DELIVERY_LOCATION,
            tripId: tripDetail._id,
          }),
        );
        break;
      case DRIVER_STATUS.REACHED_DELIVERY_LOCATION:
        store.dispatch(
          setDriverStatus({
            driverStatus: DRIVER_STATUS.DELIVERED,
            tripId: tripDetail._id,
          }),
        );
        break;
      case DRIVER_STATUS.DELIVERED:
        store.dispatch(resetDeliveryModeState());
        navigation.goBack();
        break;
      default:
        break;
    }
  }, [deliveryStatus, navigation, store, tripDetail._id]);

  const showSecondCTA = useMemo(
    () =>
      !(
        deliveryStatus === DRIVER_STATUS.TRIP_ACCEPTED ||
        deliveryStatus === DRIVER_STATUS.GOING_TO_PICKUP_LOCATION
      ),
    [deliveryStatus],
  );

  const mainCTAText = useMemo(
    () =>
      deliveryStatus === DRIVER_STATUS.GOING_TO_PICKUP_LOCATION
        ? 'Reached pickup location'
        : deliveryStatus === DRIVER_STATUS.REACHED_PICKUP_LOCATION ||
          deliveryStatus === DRIVER_STATUS.PICKING_ITEMS ||
          deliveryStatus === DRIVER_STATUS.WAITING_FOR_USER_PAYMENT
        ? 'Start Delivery'
        : deliveryStatus === DRIVER_STATUS.GOING_TO_DELIVERY_LOCATION
        ? 'Reached delivery location'
        : deliveryStatus === DRIVER_STATUS.REACHED_DELIVERY_LOCATION
        ? 'Items Delivered'
        : 'Finish trip',
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
      ((deliveryStatus === DRIVER_STATUS.WAITING_FOR_USER_PAYMENT ||
        deliveryStatus === DRIVER_STATUS.REACHED_PICKUP_LOCATION ||
        deliveryStatus === DRIVER_STATUS.PICKING_ITEMS) &&
        !userPaid) ||
      (deliveryStatus === DRIVER_STATUS.GOING_TO_DELIVERY_LOCATION &&
        !isDriverNearBy(location, deliveryLocation))
    );
  }, [deliveryLocation, deliveryStatus, location, pickupLocation, userPaid]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Label
          text={
            deliveryStatus === DRIVER_STATUS.WAITING_FOR_USER_PAYMENT
              ? userPaid
                ? 'Customer has paid!'
                : 'Waiting for the customer to pay'
              : deliveryFlow === 0
              ? "Let's pickup the items to be deliverd!"
              : "Great! You have picked up the items, let's delivery them!"
          }
          textStyle={styles.title}
        />
        <Label
          text={
            deliveryStatus === DRIVER_STATUS.WAITING_FOR_USER_PAYMENT
              ? userPaid
                ? 'You can start delivery now!'
                : "Let's wait for the customer to finish payment before delivering."
              : (deliveryFlow === 0
                  ? 'Drive to the pickup location.'
                  : 'Drive to the delivery location.') +
                ' Tap on the map for navigation.'
          }
          textStyle={styles.subtitle}
        />
      </View>
      {deliveryFlow !== -1 ? (
        <MapView
          provider={PROVIDER_GOOGLE}
          region={getRegionForCoordinates([
            deliveryFlow === 1 ? deliveryLocation : pickupLocation,
            location,
            ...(polyline || []),
          ])}
          showsUserLocation={false}
          showsPointsOfInterest={true}
          moveOnMarkerPress={false}
          onPress={() => {
            const navigateFrom = `${location.latitude},${location.longitude}`;
            const navigateTo = `${
              deliveryFlow === 1
                ? deliveryLocation.latitude
                : pickupLocation.latitude
            },${
              deliveryFlow === 1
                ? deliveryLocation.longitude
                : pickupLocation.longitude
            }`;
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
            <View style={styles.avatarContainer}>
              <Image
                source={require('../../assets/images/avatar.png')}
                style={{height: 44, width: 44}}
              />
            </View>
          </Marker>
          <Marker
            title={deliveryFlow === 1 ? 'Delivery location' : 'Pickup location'}
            coordinate={deliveryFlow === 1 ? deliveryLocation : pickupLocation}>
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
      ) : (
        <View style={styles.tripError}>
          <Label
            text={'There is some error in the trip. Please cancel the trip!'}
            textStyle={styles.tripErrorText}
          />
        </View>
      )}
      <View style={styles.secondaryCTAContainer}>
        {showSecondCTA ? (
          <Button
            onPress={() => {
              if (
                deliveryStatus !== DRIVER_STATUS.PICKING_ITEMS &&
                deliveryStatus !== DRIVER_STATUS.DELIVERED &&
                deliveryStatus !== DRIVER_STATUS.GOING_TO_DELIVERY_LOCATION
              ) {
                store.dispatch(
                  setDriverStatus({
                    driverStatus: DRIVER_STATUS.PICKING_ITEMS,
                    tripId: tripDetail._id,
                  }),
                );
              }
              setShowItemsModal(true);
            }}
            style={{
              ...styles.secondaryCTA,
              marginRight: !tripDetail.userPaid ? 4 : 0,
            }}
            text={'Show pick-up items'}
            textStyle={styles.chanegStatusTextSecondary}
          />
        ) : null}
        {showSecondCTA && !userPaid ? (
          <Button
            onPress={() => {
              setShowUserPaymentModal(true);
            }}
            style={{...styles.secondaryCTA, marginLeft: 4}}
            text={'Request payment'}
            textStyle={styles.chanegStatusTextSecondary}
          />
        ) : null}
      </View>
      <Button
        disabled={mainCTADisabled}
        onPress={mainActionOnPress}
        style={{
          ...styles.chanegStatusButton,
          backgroundColor: mainCTADisabled ? colors.greyDark : colors.secondary,
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
        onModalClose={() => setShowUserPaymentModal(false)}
        hasBackdrop={true}
        onBackdropPress={() => setShowUserPaymentModal(false)}
        visible={showUserPaymentModal}>
        <SafeAreaView style={styles.askPaymentModal}>
          <View
            style={{
              backgroundColor: colors.white,
              padding: 12,
              borderRadius: 8,
            }}>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={value => {
                value = value.replaceAll(/[^\d*\.?\d*$]/g, '');
                if (!isNaN(Number(value))) {
                  setCorrectAmount(true);
                } else {
                  setCorrectAmount(false);
                }
                setAmountToPay(value);
              }}
              placeholder="Enter the amount for the customer to pay"
              placeholderTextColor={colors.greyDark}
              style={{
                color: colors.black,
                marginBottom: 32,
                fontSize: 16,
              }}
              underlineColorAndroid={
                correctAmount ? colors.secondary : colors.red
              }
              value={amountToPay}
            />
            <View style={{flexDirection: 'row'}}>
              <Button
                disabled={!correctAmount}
                onPress={() => {
                  Alert.alert(
                    'Request payment from user',
                    `Are you sure you want to request $${Number(
                      amountToPay,
                    ).toFixed(2)} from the user?`,
                    [
                      {
                        text: 'Yes',
                        onPress: () => {
                          store.dispatch(
                            setDriverStatus({
                              amount: Number(amountToPay).toFixed(2),
                              driverStatus:
                                DRIVER_STATUS.WAITING_FOR_USER_PAYMENT,
                              tripId: tripDetail._id,
                            }),
                          );
                          setShowUserPaymentModal(false);
                        },
                        style: 'default',
                      },
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                    ],
                  );
                }}
                style={{
                  ...styles.askPaymentButton,
                  backgroundColor: correctAmount
                    ? colors.secondary
                    : colors.greyDark,
                  marginRight: 4,
                }}
                text={'Request user'}
                textStyle={{
                  ...styles.askPaymentButtonText,
                  color: colors.white,
                }}
              />
              <Button
                onPress={() => setShowUserPaymentModal(false)}
                style={{
                  ...styles.askPaymentButton,
                  marginLeft: 4,
                }}
                text={'Continue picking items'}
                textStyle={styles.askPaymentButtonText}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
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
  avatarContainer: {
    backgroundColor: colors.greyLight,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: 100,
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
  title: {
    color: colors.white,
    fontSize: 22,
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
});

export default OnTheMoveScreen;
