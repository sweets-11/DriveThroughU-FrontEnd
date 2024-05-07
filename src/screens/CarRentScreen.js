import React, {useContext, useEffect, useState} from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../config/colors';
import PickAddress from '../components/PickAddress';
import Label from '../components/Label';
import Button from '../components/Button';
import ParcelContent from '../components/ParcelContent';
import {ScreenNames} from '../navigation/ScreenNames';
import {ReactReduxContext} from 'react-redux';
import {findDriver} from '../store/reducers/DriverReducer';
import NumberPicker from '../components/NumberPicker';

export const SelectItem = ({
  active = false,
  description,
  onPress = () => {},
  selected = false,
  title,
  style = {},
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.5}
      onPress={onPress}
      style={{...styles.addressButton, ...style}}>
      <View
        style={{
          ...styles.iconShadow,
          borderColor: selected ? colors.primary : colors.greyLight,
        }}>
        <MaterialCommunityIcons
          name={selected ? 'check-circle' : 'circle-outline'}
          color={selected ? colors.secondary : colors.neutralGrey}
          size={30}
        />
      </View>
      <View style={styles.addressContainer}>
        <View style={{flexDirection: 'row'}}>
          <Label
            text={title}
            textStyle={{
              ...styles.addressTitleText,
              color: selected ? colors.black : colors.neutralGrey,
            }}
          />
          {selected ? null : (
            <Label
              text={'*'}
              textStyle={{...styles.addressTitleText, color: colors.red}}
            />
          )}
        </View>
        <Label text={description} textStyle={styles.addressText} />
        <View
          style={{
            ...styles.dash,
            backgroundColor: active ? colors.secondary : colors.neutralGrey,
          }}
        />
      </View>
    </TouchableOpacity>
  );
};

const CarRentScreen = ({navigation, route}) => {
  const [pickAddressModalVisible, setPickAddressModalVisible] = useState(false);
  const [parcelContentModalVisible, setParcelContentModalVisible] =
    useState(false);
  const [pickAddressProps, setPickAddressProps] = useState({
    mapTitle: '',
    onConfirmButtonPress: () => {},
    title: '',
  });
  const [activeItem, setActiveItem] = useState(0);
  const [orderDetails, setOrderDetails] = useState({
    pickupAddress: {},
    vehicleType: [],
    hours: {0: '0'},
  });
  const [isConfirmButtonDisabled, setIsConfirmButtonDisabled] = useState(false);
  const [hoursModalVisible, setHoursModalVisible] = useState(false);
  const {store} = useContext(ReactReduxContext);
  useEffect(() => {
    const {pickupAddress, hours, vehicleType} = orderDetails;
    if (
      pickupAddress.latitude &&
      pickupAddress.longitude &&
      vehicleType.length &&
      Number(hours[0])
    ) {
      setIsConfirmButtonDisabled(true);
    } else {
      setIsConfirmButtonDisabled(false);
    }
  }, [orderDetails]);
  return (
    <>
      <ScrollView
        contentContainerStyle={{alignItems: 'center'}}
        style={styles.container}>
        <SelectItem
          active={activeItem === 0}
          description={
            orderDetails.pickupAddress.value || 'Search pickup location'
          }
          onPress={() => {
            setActiveItem(0);
            setPickAddressProps({
              mapTitle: 'Set pickup location',
              onConfirmButtonPress: (isNewAddress, address) => {
                if (isNewAddress) {
                  navigation.navigate(ScreenNames.ADD_ADDRESS, {
                    location: address,
                    confirmCallback: newaddress => {
                      console.log('New: ', newaddress);
                      const {house, floor, apartment, title} =
                        newaddress.address;
                      const {address, coords} = newaddress.location;
                      setOrderDetails(prevValue => ({
                        ...prevValue,
                        pickupAddress: {
                          name: title,
                          value:
                            `${house}, ${floor}, ${apartment}, ${address.value}`.replace(
                              /\,+/g,
                              ',',
                            ),
                          ...coords,
                        },
                      }));
                    },
                  });
                } else {
                  setOrderDetails(prevValue => ({
                    ...prevValue,
                    pickupAddress: {...address.address, ...address.coords},
                  }));
                }
                setPickAddressModalVisible(false);
              },
              title: 'Pickup address',
            });
            setPickAddressModalVisible(true);
          }}
          style={{marginBottom: 24}}
          selected={
            orderDetails.pickupAddress.latitude &&
            orderDetails.pickupAddress.longitude
          }
          title={orderDetails.pickupAddress.name || 'Pickup address'}
        />
        <SelectItem
          active={activeItem === 2}
          description={
            orderDetails.vehicleType.length
              ? orderDetails.vehicleType.map(item => item.name).join(', ')
              : 'e.g. Small class, Large class'
          }
          onPress={() => {
            setActiveItem(2);
            setParcelContentModalVisible(true);
          }}
          style={{marginVertical: 24}}
          selected={orderDetails.vehicleType.length}
          title={'Select car class'}
        />
        <SelectItem
          active={activeItem === 3}
          description={
            Number(orderDetails.hours[0])
              ? orderDetails.hours[0] +
                (Number(orderDetails.hours[0]) === 1 ? ' Hour' : ' Hours')
              : '1 Hour, 2 Hours'
          }
          onPress={() => {
            setActiveItem(3);
            setHoursModalVisible(true);
          }}
          selected={Number(orderDetails.hours[0])}
          style={{marginTop: 24}}
          title={'Select duration'}
        />
      </ScrollView>
      <Button
        disabled={!isConfirmButtonDisabled}
        onPress={() => {
          store.dispatch(
            findDriver({
              isParcelDelivery: false,
              isCarRent: true,
              orderDetails,
            }),
          );
          navigation.navigate(ScreenNames.CAR_RENT_PICKUP_SCREEN, {
            isCarRent: true,
            orderDetails,
          });
        }}
        style={{
          ...styles.confirmButton,
          backgroundColor: isConfirmButtonDisabled
            ? colors.secondary
            : colors.greyDark,
        }}
        text={'Confirm request'}
        textStyle={styles.confirmButtonText}
      />
      <PickAddress
        mapTitle={pickAddressProps.mapTitle}
        onConfirmButtonPress={pickAddressProps.onConfirmButtonPress}
        setModalVisible={setPickAddressModalVisible}
        title={pickAddressProps.title}
        visible={pickAddressModalVisible}
      />
      <ParcelContent
        carRent={true}
        onModalClose={() => setParcelContentModalVisible(false)}
        onSelectItem={selectedItems =>
          setOrderDetails(prevValue => ({
            ...prevValue,
            vehicleType: selectedItems,
          }))
        }
        preSelectedItems={orderDetails.vehicleType}
        visible={parcelContentModalVisible}
      />
      <NumberPicker
        onModalClose={() => setHoursModalVisible(false)}
        setValue={hours =>
          setOrderDetails(prevValue => ({...prevValue, hours}))
        }
        value={orderDetails.hours}
        visible={hoursModalVisible}
      />
    </>
  );
};

const styles = StyleSheet.create({
  addressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  addressContainer: {
    marginLeft: 46,
    flex: 1,
  },
  addressText: {
    color: colors.greyDark,
    fontSize: 12,
    marginBottom: 8,
  },
  addressTitleText: {
    fontSize: 14,
    marginBottom: 8,
  },
  confirmButton: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 100,
    bottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    position: 'absolute',
    width: Dimensions.get('window').width - 32,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 16,
  },
  container: {
    backgroundColor: colors.white,
    flex: 1,
    padding: 16,
  },
  dash: {
    backgroundColor: colors.secondary,
    height: 2,
    width: '100%',
  },
  iconShadow: {
    borderRadius: 100,
    borderWidth: 2,
    position: 'absolute',
    top: 0,
  },
});

export default CarRentScreen;
