import React, {useContext, useEffect, useState} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../config/colors';
import PickAddress from '../components/PickAddress';
import Label from '../components/Label';
import Button from '../components/Button';
import ParcelContent from '../components/ParcelContent';
import {ScreenNames} from '../navigation/ScreenNames';
import {ReactReduxContext} from 'react-redux';
import {findDriver} from '../store/reducers/DriverReducer';
import {convertToBool} from '../utils/stringOperators';

const ParcelScreen = ({navigation, route}) => {
  const isSendParcel = convertToBool(route.params?.isSendParcel);
  useEffect(() => {
    if (isSendParcel) {
      navigation.setOptions({headerTitle: 'Send Mail'});
    } else {
      navigation.setOptions({headerTitle: 'Receive Mail'});
    }
  }, [isSendParcel, navigation]);
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
    deliveryAddress: {},
    packageContent: [],
  });
  const [isConfirmButtonDisabled, setIsConfirmButtonDisabled] = useState(false);
  const {store} = useContext(ReactReduxContext);
  useEffect(() => {
    const {pickupAddress, deliveryAddress, packageContent} = orderDetails;
    if (
      pickupAddress.latitude &&
      pickupAddress.longitude &&
      deliveryAddress.latitude &&
      deliveryAddress.longitude &&
      packageContent.length
    ) {
      setIsConfirmButtonDisabled(true);
    } else {
      setIsConfirmButtonDisabled(false);
    }
  }, [orderDetails]);

  const SelectItem = ({
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
  return (
    <View style={styles.container}>
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
                    const {house, floor, apartment, title} = newaddress.address;
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
        active={activeItem === 1}
        description={
          orderDetails.deliveryAddress.value || 'Search delivery location'
        }
        onPress={() => {
          setActiveItem(1);
          setPickAddressProps({
            mapTitle: 'Set delivery location',
            onConfirmButtonPress: (isNewAddress, address) => {
              if (isNewAddress) {
                navigation.navigate(ScreenNames.ADD_ADDRESS, {
                  location: address,
                  confirmCallback: newaddress => {
                    console.log('New: ', newaddress);
                    const {house, floor, apartment, title} = newaddress.address;
                    const {address, coords} = newaddress.location;
                    setOrderDetails(prevValue => ({
                      ...prevValue,
                      deliveryAddress: {
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
                  deliveryAddress: {...address.address, ...address.coords},
                }));
              }
              setPickAddressModalVisible(false);
            },
            title: 'delivery address',
          });
          setPickAddressModalVisible(true);
        }}
        style={{marginVertical: 24}}
        selected={
          orderDetails.deliveryAddress.latitude &&
          orderDetails.deliveryAddress.longitude
        }
        title={orderDetails.deliveryAddress.name || 'Delivery address'}
      />
      <SelectItem
        active={activeItem === 2}
        description={
          orderDetails.packageContent.length
            ? orderDetails.packageContent.map(item => item.name).join(', ')
            : 'e.g. Food, Documents'
        }
        onPress={() => {
          setActiveItem(2);
          setParcelContentModalVisible(true);
        }}
        style={{marginTop: 24}}
        selected={orderDetails.packageContent.length}
        title={'Select package contents'}
      />
      <Button
        disabled={!isConfirmButtonDisabled}
        onPress={() => {
          store.dispatch(findDriver({isParcelDelivery: true, orderDetails}));
          navigation.navigate(ScreenNames.DELIVERY_SCREEN, {
            isParcelDelivery: true,
            orderDetails,
          });
        }}
        style={{
          ...styles.confirmButton,
          backgroundColor: isConfirmButtonDisabled
            ? colors.secondary
            : colors.greyDark,
        }}
        text={'Confirm order'}
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
        onModalClose={() => setParcelContentModalVisible(false)}
        onSelectItem={selectedItems =>
          setOrderDetails(prevValue => ({
            ...prevValue,
            packageContent: selectedItems,
          }))
        }
        preSelectedItems={orderDetails.packageContent}
        visible={parcelContentModalVisible}
      />
    </View>
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
    borderRadius: 100,
    bottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    position: 'absolute',
    width: '100%',
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 16,
  },
  container: {
    alignItems: 'center',
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

export default ParcelScreen;
