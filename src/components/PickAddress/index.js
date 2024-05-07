import React, {useContext, useEffect, useState} from 'react';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Modal from '../Modal';
import colors from '../../config/colors';
import Label from '../Label';
import {ReactReduxContext} from 'react-redux';
import {getAddresses as getSavedAddresses} from '../../store/selectors/AddressSelectors';
import Geolocation from '@react-native-community/geolocation';
import {getLocationPermission} from '../../utils/locationPermission';
import {getGeolocation} from '../../utils/getGeolocation';
import Loader from '../Loader/Loader';
import LocationFromMap from '../LocationFromMap';

navigator.geolocation = require('@react-native-community/geolocation');

const PickAddress = ({
  mapTitle,
  onConfirmButtonPress = () => {},
  setModalVisible,
  title,
  visible,
}) => {
  const {store} = useContext(ReactReduxContext);
  const [selectedAddress, setSelectedAddress] = useState(
    getSavedAddresses(store.getState()),
  );
  const [selectFromMap, setSelectFromMap] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedLocationFromPlaces, setSelectedLocationFromPlaces] =
    useState(null);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setSelectedAddress(getSavedAddresses(store.getState()));
    });

    return () => {
      unsubscribe();
    };
  }, [store]);
  useEffect(() => {
    if (selectFromMap && !locationPermission) {
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
  }, [locationPermission, selectFromMap]);

  useEffect(() => {
    if (selectFromMap && locationPermission && !currentLocation) {
      getGeolocation(locationPermission).then(info => {
        setCurrentLocation(info?.coords);
      });
    }
  }, [selectFromMap, locationPermission, currentLocation]);

  return (
    <Modal
      visible={visible}
      onModalClose={() => setModalVisible(false)}
      onBackdropPress={() => setModalVisible(false)}>
      <SafeAreaView style={styles.container}>
        <View
          style={{
            ...styles.title,
            justifyContent: selectFromMap ? 'flex-start' : 'space-between',
          }}>
          {selectFromMap ? null : (
            <Label
              text={selectFromMap ? mapTitle : title}
              textStyle={styles.titleText}
            />
          )}
          <TouchableOpacity
            onPress={() =>
              selectFromMap ? setSelectFromMap(false) : setModalVisible(false)
            }>
            <MaterialCommunityIcons
              name={selectFromMap ? 'arrow-left' : 'close'}
              color={colors.black}
              size={28}
            />
          </TouchableOpacity>
          {selectFromMap ? (
            <Label
              text={selectFromMap ? mapTitle : title}
              textStyle={{...styles.titleText, marginLeft: 16}}
            />
          ) : null}
        </View>
        {selectFromMap ? (
          currentLocation ? (
            <View style={styles.mapViewContainer}>
              <LocationFromMap
                initialCoordinates={
                  selectedLocationFromPlaces
                    ? selectedLocationFromPlaces.location
                    : currentLocation
                }
                isLocationPreSelected={!!selectedLocationFromPlaces}
                onConfirmPress={address => {
                  onConfirmButtonPress(true, address);
                  setSelectFromMap(false);
                }}
              />
            </View>
          ) : (
            <Loader visible={!currentLocation} from="PickAddress" />
          )
        ) : (
          <>
            <View style={{...styles.container, height: null}}>
              <GooglePlacesAutocomplete
                currentLocation={true}
                currentLocationLabel="My location"
                debounce={400}
                enableHighAccuracyLocation={false}
                fetchDetails={true}
                onPress={(data, details = null) => {
                  console.log(data, details.geometry);
                  const {lat, lng} = details?.geometry.location;
                  setSelectedLocationFromPlaces({
                    data,
                    location: {latitude: lat, longitude: lng},
                  });
                  setSelectFromMap(true);
                }}
                placeholder="Address search e.g. Liberty tower"
                query={{
                  key: 'AIzaSyCUyKoz7FOr7RQUtmTMU5_-Hn5aird4Ry4',
                  language: 'en',
                  components: 'country:in',
                }}
                styles={{
                  container: {flex: null},
                  description: {color: 'black'},
                }}
                textInputProps={{
                  borderRadius: 100,
                  backgroundColor: colors.greyLight,
                  errorStyle: {color: colors.red},
                  fontSize: 16,
                  leftIcon: {type: 'font-awesome', name: 'chevron-left'},
                  placeholderTextColor: colors.greyDark,
                  color: colors.black,
                }}
              />
              <View style={styles.lineContainer}>
                <View style={styles.line} />
                <Label text={'OR'} textStyle={styles.OR} />
                <View style={styles.line} />
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSelectedLocationFromPlaces(null);
                  setSelectFromMap(true);
                }}
                style={styles.mapSearchContainer}>
                <MaterialCommunityIcons
                  name="map-search"
                  color={colors.secondary}
                  size={28}
                />
                <Label
                  text={'Select location via map'}
                  textStyle={styles.mapSearchText}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.lineThick} />
            <ScrollView style={styles.savedAddressContainer}>
              <Label
                text={'Saved Addresses'}
                textStyle={styles.savedAddressText}
              />
              {selectedAddress?.map(({address, coords}, index) => {
                return (
                  <TouchableOpacity
                    key={index.toString()}
                    onPress={() =>
                      onConfirmButtonPress(false, {address, coords})
                    }
                    style={styles.savedAddressButton}>
                    <MaterialCommunityIcons
                      name="map-marker"
                      color={colors.greyDark}
                      size={28}
                    />
                    <View style={{marginLeft: 16}}>
                      <Label
                        text={address.name}
                        textStyle={styles.savedAddressName}
                      />
                      <Label
                        text={address.buildingDetails}
                        textStyle={styles.savedAddressValue}
                      />
                      <Label
                        text={address.value}
                        textStyle={{
                          ...styles.savedAddressValue,
                          fontSize: 13,
                        }}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  confirmSelectedPlacButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 100,
    justifyContent: 'center',
    padding: 16,
    marginTop: 18,
    width: '100%',
  },
  confirmSelectedPlaceText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  container: {
    backgroundColor: colors.white,
    height: '100%',
    padding: 16,
    width: '100%',
  },
  line: {
    flex: 0.45,
    height: 1,
    backgroundColor: colors.greyLight,
  },
  lineContainer: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginVertical: 16,
    width: '100%',
  },
  lineThick: {
    backgroundColor: colors.greyLight,
    height: 8,
    marginVertical: 8,
    width: '100%',
  },
  mapSearchContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    width: '100%',
  },
  mapSearchText: {
    color: colors.secondary,
    fontSize: 16,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  mapView: {
    flex: 1,
    marginVertical: 16,
  },
  mapViewContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  OR: {
    color: colors.greyDark,
    fontSize: 16,
  },
  savedAddressButton: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginVertical: 16,
    width: '100%',
  },
  savedAddressContainer: {
    backgroundColor: colors.white,
    marginTop: 8,
    padding: 16,
    width: '100%',
  },
  savedAddressName: {
    color: colors.black,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  savedAddressText: {
    color: colors.black,
    fontSize: 22,
  },
  savedAddressValue: {
    color: colors.greyDark,
    fontSize: 14,
  },
  selectedPlaceAddress: {
    color: colors.greyDark,
    fontSize: 18,
    marginTop: 8,
  },
  selectedPlaceName: {
    fontSize: 22,
    color: colors.black,
  },
  title: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
    width: '100%',
  },
  titleText: {
    color: colors.black,
    fontSize: 18,
  },
});

export default PickAddress;
