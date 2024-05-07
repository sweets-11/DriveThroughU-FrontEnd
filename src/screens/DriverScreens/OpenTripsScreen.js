import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../../config/colors';
import {ReactReduxContext} from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from '@react-native-community/geolocation';
import {useFocusEffect} from '@react-navigation/native';
import Label from '../../components/Label';
import {ScreenNames} from '../../navigation/ScreenNames';
import {
  getDeliveryMode,
  getDeliveryTrips,
  getDeliveryTripsLoading,
  getLocation,
} from '../../store/selectors/DeliveryModeSelectors';
import {
  DRIVER_STATUS,
  fetchDeliveryTrips,
  setDriverStatus,
  updateDeliveryTrip,
  updateLocation,
} from '../../store/reducers/DeliveryModeReducer';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import {getUpdatedTripTime} from '../../utils/driverFunctions';
import {getGeolocation} from '../../utils/getGeolocation';
import {getLocationPermission} from '../../utils/locationPermission';

let intervalId = null;

const OpenTripsScreen = ({navigation}) => {
  const {store} = useContext(ReactReduxContext);
  const [deliveryMode, setDeliveryMode] = useState(
    getDeliveryMode(store.getState()),
  );
  const [tripsRefreshing, setTripsRefreshing] = useState(
    getDeliveryTripsLoading(store.getState()),
  );
  const [trips, setTrips] = useState(getDeliveryTrips(store.getState()));
  const [tripDetail, setTripDetail] = useState(null);
  const [showTripModal, setShowTripModal] = useState(false);
  const [location, setLocation] = useState(getLocation(store.getState()));
  const [tripTime, setTripTime] = useState({});
  const [locationPermission, setLocationPermission] = useState(null);

  const isCarRent = useMemo(
    () => tripDetail?.tripType?.toLowerCase() === 'car rent',
    [tripDetail],
  );

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      setDeliveryMode(getDeliveryMode(state));
      setTrips(getDeliveryTrips(state));
      setTripsRefreshing(getDeliveryTripsLoading(state));
      setLocation(getLocation(state));
    });
    setTimeout(() => store.dispatch(fetchDeliveryTrips({location})));

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line
  }, [store]);

  useEffect(() => {
    if (locationPermission === null) {
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

  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        if (locationPermission) {
          getGeolocation(locationPermission).then(info => {
            console.log('Updating location from opentrips screen');
            store.dispatch(
              updateLocation({
                location: {
                  latitude: info?.coords?.latitude,
                  longitude: info?.coords?.longitude,
                },
              }),
            );
          });
        }
      }, 60000);
      return () => {
        console.log('Clearing update location interval from open trips screen');
        clearInterval(interval);
      };
    }, [locationPermission, store]),
  );

  useFocusEffect(
    useCallback(() => {
      intervalId = setInterval(() => {
        store.dispatch(fetchDeliveryTrips({location}));
      }, 10000);

      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }, [location, store]),
  );

  useEffect(() => {
    navigation.setOptions({
      header: () => {
        return (
          <View style={styles.headerContainer}>
            <Label text={'Delivery mode'} textStyle={styles.headerText} />
            <TouchableOpacity
              onPress={() => navigation.navigate(ScreenNames.MY_PROFILE_SCREEN)}
              style={styles.profileButton}>
              <MaterialCommunityIcons
                name="account"
                size={32}
                color={colors.white}
              />
              {deliveryMode ? (
                <MaterialCommunityIcons
                  name="truck-delivery"
                  size={32}
                  color={colors.white}
                />
              ) : null}
            </TouchableOpacity>
          </View>
        );
      },
      headerShown: true,
    });
  }, [deliveryMode, navigation]);

  const onTripsRefresh = useCallback(() => {
    if (locationPermission) {
      getGeolocation(locationPermission).then(info => {
        store.dispatch(
          updateLocation({
            location: {
              latitude: info?.coords?.latitude,
              longitude: info?.coords?.longitude,
            },
          }),
        );
        store.dispatch(
          fetchDeliveryTrips({
            location: {
              latitude: info?.coords?.latitude,
              longitude: info?.coords?.longitude,
            },
          }),
        );
      });
    }
  }, [locationPermission, store]);

  const TripInfo = ({label, style = {}, text, tripTimeLoading}) => {
    return (
      <View style={{...style, alignItems: 'center', flexDirection: 'row'}}>
        <Label
          text={label}
          style={{...styles.deliveryTypeText, fontWeight: 'bold'}}
        />

        <Label
          text={text}
          style={{...styles.deliveryTypeText, marginRight: 8}}
        />
        {tripTimeLoading ? (
          <ActivityIndicator size={'small'} color={colors.secondary} />
        ) : null}
      </View>
    );
  };
  const TripInfoIcon = ({iconName, style = {}, text}) => {
    return (
      <View style={[{alignItems: 'center', flexDirection: 'row'}, style]}>
        <MaterialCommunityIcons
          name={iconName}
          color={colors.secondary}
          size={32}
        />
        <Label
          text={text}
          style={{...styles.deliveryTypeText, marginLeft: 8}}
        />
      </View>
    );
  };

  const renderItem = ({item, index}) => {
    const isTripOpen =
      item.tripStatus?.toLowerCase() ===
        DRIVER_STATUS.FINDING_DRIVERS.toLowerCase() || !item.tripStatus;
    const pickupToDropoff = item.pickupToDropoff;
    const isItemCarRent = item.tripType?.toLowerCase() === 'car rent';
    return item.noTrips ? (
      <Label
        text={'There are no open trips right now!\nTry again later.'}
        textStyle={styles.noTrips}
      />
    ) : (
      <View
        key={index.toString()}
        style={{
          ...styles.tripCard,
          ...(item.newTrip
            ? {
                borderWidth: 2,
                borderColor: colors.babyBLue,
                shadowColor: colors.babyBLue,
              }
            : {}),
        }}>
        <TripInfo
          label={'Type: '}
          style={{marginBottom: 8}}
          text={item.tripType || 'Mail'}
        />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%',
          }}>
          <TripInfoIcon
            iconName={
              isItemCarRent ? 'clock-time-three' : 'map-marker-distance'
            }
            style={{marginBottom: 8, marginRightl: 8}}
            text={
              isItemCarRent
                ? item.bookingHours +
                  (Number(item.bookingHours) === 1 ? ' hour' : ' hours')
                : pickupToDropoff.distance
            }
          />
          {isItemCarRent ? null : (
            <TripInfoIcon
              iconName={'map-clock'}
              style={{marginBottom: 8, marginLeft: 8}}
              text={pickupToDropoff.time}
            />
          )}
        </View>
        <Button
          onPress={() => {
            if (isTripOpen) {
              setTripDetail(item);
              setTimeout(() => setShowTripModal(true));
              !isItemCarRent &&
                getUpdatedTripTime({setTripTime, tripId: item._id});
            } else {
              store.dispatch(updateDeliveryTrip({trip: item}));
              !isItemCarRent &&
                store.dispatch(
                  setDriverStatus({
                    driverStatus: item.tripStatus,
                    location: location,
                    tripId: item._id,
                  }),
                );
              setTimeout(() =>
                navigation.navigate(
                  isItemCarRent
                    ? ScreenNames.ON_THE_RIDE_SCREEN
                    : ScreenNames.ON_THE_MOVE_SCREEN,
                  {
                    tripDetail: item,
                  },
                ),
              );
              if (intervalId) {
                clearInterval(intervalId);
              }
            }
          }}
          style={styles.viewTripButton}
          text={isTripOpen ? 'View' : 'Open ongoing trip'}
          textStyle={styles.viewTripText}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={trips}
        refreshing={tripsRefreshing}
        onRefresh={onTripsRefresh}
        renderItem={renderItem}
        style={styles.flatlist}
      />
      <Modal
        animationIn="slideInUp"
        animationOut="slideOutDown"
        onModalClose={() => setShowTripModal(false)}
        hasBackdrop={true}
        onBackdropPress={() => setShowTripModal(false)}
        visible={showTripModal && tripDetail}>
        <SafeAreaView style={styles.tripDetailModal}>
          <View style={styles.tripDetailHeader}>
            <Label
              text={'Trip detail'}
              textStyle={styles.tripDetailHeaderText}
            />
            <TouchableOpacity onPress={() => setShowTripModal(false)}>
              <MaterialCommunityIcons
                name="close-circle-outline"
                color={colors.black}
                size={28}
              />
            </TouchableOpacity>
          </View>
          {tripDetail ? (
            <View style={styles.tripDetailContainer}>
              <TripInfo
                label={'Trip type: '}
                style={{marginVertical: 8}}
                text={tripDetail.tripType}
              />
              <TripInfo
                label={isCarRent ? 'Booking for: ' : 'Total distance: '}
                style={{marginVertical: 8}}
                text={
                  isCarRent
                    ? tripDetail.bookingHours +
                      (Number(tripDetail.bookingHours) === 1
                        ? ' hour'
                        : ' hours')
                    : tripTime[tripDetail._id].distance ||
                      tripDetail.pickupToDropoff.distance
                }
                tripTimeLoading={
                  isCarRent ? false : tripTime[tripDetail._id].loading
                }
              />
              {isCarRent ? null : (
                <TripInfo
                  label={'Estimated trip time: '}
                  style={{marginVertical: 8}}
                  text={
                    tripTime[tripDetail._id].time ||
                    tripDetail.pickupToDropoff.time
                  }
                  tripTimeLoading={tripTime[tripDetail._id].loading}
                />
              )}
              <Button
                onPress={() => {
                  store.dispatch(updateDeliveryTrip({trip: tripDetail}));
                  store.dispatch(
                    setDriverStatus({
                      driverStatus: DRIVER_STATUS.TRIP_ACCEPTED,
                      location: location,
                      tripId: tripDetail._id,
                    }),
                  );
                  setShowTripModal(false);
                  navigation.navigate(
                    isCarRent
                      ? ScreenNames.ON_THE_RIDE_SCREEN
                      : ScreenNames.ON_THE_MOVE_SCREEN,
                    {
                      tripDetail,
                    },
                  );
                  if (intervalId) {
                    clearInterval(intervalId);
                  }
                }}
                style={styles.selectTripButton}
                text={'Accept trip'}
                textStyle={styles.selectTripText}
              />
            </View>
          ) : null}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.white,
    flex: 1,
    justifyContent: 'center',
  },
  deliveryTypeText: {
    color: colors.black,
    fontSize: 16,
  },
  flatlist: {
    backgroundColor: colors.white,
    flex: 1,
    padding: 16,
    width: '100%',
  },
  headerContainer: {
    alignItems: 'center',
    backgroundColor: colors.tertiary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    width: '100%',
  },
  headerText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  noTrips: {
    color: colors.greyDark,
    fontSize: 18,
    textAlign: 'center',
  },
  profileButton: {
    flexDirection: 'row',
  },
  selectTripButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 8,
    bottom: 16,
    justifyContent: 'center',
    padding: 16,
    position: 'absolute',
    width: '100%',
  },
  selectTripText: {
    color: colors.white,
    fontSize: 18,
  },
  tripCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: 8,
    elevation: 3,
    justifyContent: 'space-between',
    marginVertical: 8,
    padding: 16,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 3,
    width: '100%',
  },
  tripDetailContainer: {
    flex: 1,
    padding: 16,
    width: '100%',
  },
  tripDetailHeader: {
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
  tripDetailHeaderText: {
    color: colors.black,
    fontSize: 22,
    fontWeight: 'bold',
  },
  tripDetailModal: {
    backgroundColor: colors.white,
    bottom: 0,
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
  tripInfoContainer: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  viewTripButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    width: '100%',
  },
  viewTripText: {
    color: colors.white,
    fontSize: 18,
  },
});

export default OpenTripsScreen;
