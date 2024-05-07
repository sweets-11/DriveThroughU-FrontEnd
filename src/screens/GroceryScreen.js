import React, {useCallback, useEffect, useState} from 'react';
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from '@react-native-community/geolocation';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import colors from '../config/colors';
import {getLocationPermission} from '../utils/locationPermission';
import Label from '../components/Label';
import {getRegionForCoordinates, radiusToDelta} from '../utils/mapUtils';
import Loader from '../components/Loader/Loader';
import Button from '../components/Button';
import {ScreenNames} from '../navigation/ScreenNames';
import {placesAPI} from '../utils/placesAPI';
import _ from 'lodash';
import {getGeolocation} from '../utils/getGeolocation';
const debouncedPlacesAPI = _.debounce(placesAPI, 300);

const GroceryScreen = ({navigation}) => {
  const [searchText, setSearchText] = useState('');
  const [locationPermission, setLocationPermission] = useState(false);
  const [listMinimized, setListMinimized] = useState(true);
  const [mapHeight, setMapHeight] = useState(400);
  const [nextButtonHeight, setNextButtonHeight] = useState(36);
  const [selectedShop, setSelectedShop] = useState({});
  const [location, setLocation] = useState(
    __DEV__ && Platform.OS === 'ios'
      ? {
          accuracy: 5,
          altitude: 5,
          heading: 0,
          latitude: 22.7218014,
          longitude: 75.8786732,
          speed: 0,
          ...radiusToDelta(22.719598333333334),
        }
      : null,
  );
  const [locationLoading, setLocationLoading] = useState(false);
  const [searchData, setSearchData] = useState([]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (locationPermission && !location) {
      setLocationLoading(true);
      getLocation()
        .then(info => {
          setLocation(
            {...info?.coords, ...radiusToDelta(info?.coords?.latitude)} || null,
          );
          setLocationLoading(false);
        })
        .catch(() => {
          setLocation(null);
          setLocationLoading(false);
        });
    }
  }, [getLocation, location, locationPermission]);

  const getLocation = useCallback(() => {
    if (!locationPermission) {
      Alert.alert('Please provide the location permission first');
      return Promise.reject('Permission not granted');
    }
    return new Promise((resolve, reject) => {
      if (__DEV__ && Platform.OS === 'ios') {
        resolve({
          coords: {
            accuracy: 5,
            altitude: 5,
            heading: 0,
            latitude: 22.719598333333334,
            longitude: 75.85769833333333,
            speed: 0,
          },
        });
        return;
      }
      if (Platform.OS === 'android') {
        getGeolocation(locationPermission)
          .then(info => resolve(info))
          .catch(error => console.log('error: ', error));
      } else {
        Geolocation.getCurrentPosition(
          info => {
            console.log(info);
            resolve(info);
          },
          error => {
            console.log('error in getting location: ', error);
            reject(error);
          },
          {
            enableHighAccuracy: false,
            timeout: 20000,
            maximumAge: 0,
          },
        );
      }
    });
  }, [locationPermission]);

  const renderItem = ({item, index}) => {
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedShop(item);
          setListMinimized(true);
        }}
        style={styles.shopContainer}>
        <Label text={item.name} textStyle={styles.shopNameStyle} />
        <Label text={item.vicinity} textStyle={styles.shopAddressStyle} />
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <TextInput
            value={searchText}
            onChangeText={text => {
              console.log('text: ', text);
              if (!text || text.length < 3) {
                setSearchData([]);
                setSearchText(text);
                return;
              }
              setSearchText(text);
              if (location) {
                debouncedPlacesAPI({
                  latitude: location.latitude,
                  longitude: location.longitude,
                  setData: setSearchData,
                  text,
                });
              } else {
                Alert.alert('Location not provided!');
              }
            }}
            placeholder="Search..."
            placeholderTextColor={colors.greyDarker}
            style={styles.searchInput}
            keyboardType="ascii-capable"
            inputMode="text"
          />
          <MaterialCommunityIcons
            name="magnify"
            color={colors.greyDarker}
            size={20}
          />
        </View>
        {locationPermission && location !== null ? (
          <>
            <MapView
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: location.latitudeDelta,
                longitudeDelta: location.longitudeDelta,
              }}
              region={
                searchData.length
                  ? getRegionForCoordinates([
                      ...searchData.map(place => ({
                        latitude: place.geometry.location.lat,
                        longitude: place.geometry.location.lng,
                      })),
                      location,
                    ])
                  : {
                      latitude: location.latitude,
                      longitude: location.longitude,
                      latitudeDelta: location.latitudeDelta,
                      longitudeDelta: location.longitudeDelta,
                    }
              }
              onLayout={({
                nativeEvent: {
                  layout: {height},
                },
              }) => {
                setMapHeight(height);
              }}
              onRegionChangeComplete={values => {
                console.log('calues: ', values);
                setLocation(prevValue => ({
                  ...prevValue,
                  ...values,
                }));
              }}
              showsUserLocation={false}
              showsPointsOfInterest={true}
              moveOnMarkerPress={false}
              showsMyLocationButton={false}
              style={styles.mapView}>
              <Marker
                title={'My location'}
                coordinate={{
                  latitude: 22.722024300389588,
                  longitude: 75.87848868120322,
                }}
                key={'myLocation'}>
                <MaterialCommunityIcons
                  name="map-marker-radius"
                  color={colors.black}
                  size={44}
                />
              </Marker>
              {searchText
                ? searchData.map((shop, index) => {
                    return (
                      <Marker
                        description={shop.vicinity}
                        coordinate={{
                          latitude: shop.geometry.location.lat,
                          longitude: shop.geometry.location.lng,
                        }}
                        key={index.toString()}
                        onPress={() => {
                          console.log(`Selected shop: ${shop}`);
                          setSelectedShop(shop);
                        }}
                        title={shop.name}>
                        <MaterialCommunityIcons
                          name={
                            selectedShop.place_id === shop.place_id
                              ? 'map-marker-check'
                              : 'map-marker-outline'
                          }
                          color={
                            selectedShop.place_id === shop.place_id
                              ? colors.tertiaryBlue
                              : colors.greyDarker
                          }
                          size={44}
                        />
                      </Marker>
                    );
                  })
                : null}
            </MapView>
            <TouchableOpacity
              onPress={() => setListMinimized(v => !v)}
              style={{
                ...styles.showListButton,
                bottom: listMinimized ? 48 + nextButtonHeight : 64,
              }}>
              <Label
                text={`Show ${listMinimized ? 'list' : 'map'}`}
                textStyle={styles.showListText}
              />
              <MaterialCommunityIcons
                name={listMinimized ? 'format-list-bulleted' : 'map'}
                color={colors.navyBlueLight}
                size={22}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                getLocation()
                  .then(info => {
                    setLocation(prevValue => {
                      console.log(
                        'returning: ',
                        info?.coords
                          ? {
                              ...info?.coords,
                              ...radiusToDelta(info?.coords?.latitude),
                            }
                          : `prevValue: ${prevValue}`,
                      );
                      return info?.coords
                        ? {
                            ...info?.coords,
                            ...radiusToDelta(info?.coords?.latitude),
                          }
                        : prevValue;
                    });
                  })
                  .catch(error => {
                    console.log('error happened in getting location: ', error);
                    setLocation(prevValue => ({...prevValue}));
                  });
              }}
              style={{
                ...styles.getLocationButton,
                bottom: 64 + nextButtonHeight,
              }}>
              <MaterialCommunityIcons
                name={'crosshairs-gps'}
                color={colors.black}
                size={32}
              />
            </TouchableOpacity>
            {listMinimized ? null : searchData?.length ? (
              <FlatList
                data={searchData}
                ItemSeparatorComponent={<View style={styles.separator} />}
                renderItem={renderItem}
                style={{
                  ...styles.flatlist,
                  bottom: 48 + nextButtonHeight,
                  height: mapHeight - 64,
                }}
              />
            ) : (
              <View
                style={{
                  ...styles.flatlist,
                  alignItems: 'center',
                  bottom: 48 + nextButtonHeight,
                  height: mapHeight - 64,
                  justifyContent: 'center',
                }}>
                <Label
                  text={'Uh oh! No results found'}
                  textStyle={{color: colors.black, fontSize: 20}}
                />
                <Label
                  text={'Please enter some valid search keywords'}
                  textStyle={{color: colors.greyDark, fontSize: 14}}
                />
              </View>
            )}
          </>
        ) : (
          <View style={styles.locationPermissionContainer}>
            <Label
              text={'Please provide location permission'}
              textStyle={styles.locationPermissionText}
            />
          </View>
        )}
        <Button
          onLayout={({
            nativeEvent: {
              layout: {height},
            },
          }) => {
            setNextButtonHeight(height);
          }}
          onPress={() =>
            !Object.keys(selectedShop || {}).length
              ? Alert.alert('Please select a shop first!')
              : navigation.navigate(ScreenNames.GROCERY_LIST, {
                  location,
                  selectedShop,
                })
          }
          style={styles.nextButton}
          text={'Next'}
          textStyle={styles.nextText}
        />
      </View>
      <Loader
        text="Getting your location"
        visible={locationLoading}
        from="GroceryScreen"
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    padding: 16,
    flex: 1,
  },
  flatlist: {
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.secondary,
    elevation: 6,
    left: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
    position: 'absolute',
    right: 16,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 6,
    zIndex: 1,
  },
  getLocationButton: {
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 32,
    zIndex: 1,
  },
  locationPermissionContainer: {
    alignItems: 'center',
    backgroundColor: colors.greyLight,
    flex: 1,
    justifyContent: 'center',
    marginVertical: 16,
    textAlign: 'center',
  },
  locationPermissionText: {
    color: colors.greyDark,
    fontSize: 22,
  },
  mapView: {
    borderRadius: 8,
    flex: 1,
    marginVertical: 16,
  },
  nextButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 100,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: '100%',
  },
  nextText: {
    color: colors.white,
    fontSize: 20,
  },
  searchContainer: {
    alignItems: 'center',
    borderColor: colors.greyDarker,
    borderRadius: 50,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'android' ? 0 : 16,
    width: '100%',
    overflow: 'hidden',
  },
  searchInput: {
    backgroundColor: colors.white,
    color: colors.black,
    fontSize: 14,
    width: '90%',
  },
  separator: {
    backgroundColor: colors.white,
    height: 8,
  },
  shopContainer: {
    backgroundColor: colors.secondary,
    padding: 16,
    width: '100%',
  },
  shopAddressStyle: {
    color: colors.snow,
    fontSize: 14,
  },
  shopNameStyle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  showListButton: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.secondary,
    bottom: 48,
    elevation: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    position: 'absolute',
    right: 48,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 6,
    zIndex: 2,
  },
  showListText: {
    color: colors.black,
    fontSize: 18,
    marginRight: 8,
  },
  viewMapButton: {
    flexDirection: 'row',
  },
  viewMapContainer: {
    alignItems: 'center',
    backgroundColor: colors.white,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: '100%',
  },
});

export default GroceryScreen;
