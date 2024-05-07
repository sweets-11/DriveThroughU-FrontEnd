import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {getAddressByCoordinates, radiusToDelta} from '../../utils/mapUtils';
import colors from '../../config/colors';
import Label from '../Label';
import Button from '../Button';

const LocationFromMap = ({
  initialCoordinates = null,
  isLocationPreSelected,
  onConfirmPress,
}) => {
  const [pickupLocation, setPickupLocation] = useState(initialCoordinates);
  const [pickupLocationAddress, setPickupLocationAddress] = useState({
    name: '',
    value: '',
  });

  const getAddress = useCallback(location => {
    getAddressByCoordinates(location)
      .then(address => {
        address = address.split(',');
        setPickupLocationAddress({
          name: `${address[0]}, ${address[1]}`,
          value: address.splice(2).join(',').trim(),
        });
      })
      .catch(error => {
        console.log('Error in fetching address from coordinates: ', error);
        setPickupLocationAddress({
          name: 'Error fetching address',
          value: 'Unknown location',
        });
      });
  }, []);

  useEffect(() => {
    if (isLocationPreSelected && !pickupLocationAddress?.name) {
      getAddress(initialCoordinates);
    } else {
      getAddress(pickupLocation);
    }
  }, [
    getAddress,
    initialCoordinates,
    isLocationPreSelected,
    pickupLocation,
    pickupLocationAddress?.name,
  ]);
  return (
    <>
      <MapView
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: initialCoordinates.latitude,
          longitude: initialCoordinates.longitude,
          ...radiusToDelta(initialCoordinates.latitude, 0.25),
        }}
        showsUserLocation={false}
        showsPointsOfInterest={true}
        moveOnMarkerPress={true}
        showsMyLocationButton={false}
        style={styles.mapView}>
        {pickupLocation ? (
          <Marker
            draggable
            title={'Pickup location'}
            coordinate={{
              latitude: pickupLocation.latitude,
              longitude: pickupLocation.longitude,
            }}
            onDragEnd={e => {
              setPickupLocation({...e.nativeEvent.coordinate});
            }}>
            <MaterialCommunityIcons
              name="map-marker"
              color={colors.secondary}
              size={44}
            />
          </Marker>
        ) : null}
      </MapView>
      <View style={styles.locationDetailsContainer}>
        <Label
          text={pickupLocationAddress.name}
          textStyle={styles.selectedPlaceName}
        />
        <Label
          text={pickupLocationAddress.value}
          textStyle={styles.selectedPlaceAddress}
        />
        <Button
          disabled={!pickupLocationAddress.name}
          onPress={() =>
            onConfirmPress({
              coords: pickupLocation,
              address: pickupLocationAddress,
            })
          }
          style={{
            ...styles.confirmSelectedPlacButton,
            backgroundColor: !pickupLocationAddress.name
              ? colors.greyDark
              : colors.secondary,
          }}
          text={'Confirm Location'}
          textStyle={styles.confirmSelectedPlaceText}
        />
      </View>
    </>
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
  locationDetailsContainer: {
    marginTop: 16,
  },
  mapView: {
    flex: 1,
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
});

export default LocationFromMap;
