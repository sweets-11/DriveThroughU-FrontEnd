import React, {useContext, useEffect, useState} from 'react';
import {
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {ReactReduxContext} from 'react-redux';
import {KeyboardAwareFlatList} from 'react-native-keyboard-aware-scroll-view';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import colors from '../config/colors';
import Button from '../components/Button';
import Label from '../components/Label';
import {getCartItems} from '../store/selectors/CartSelector';
import {
  addItem,
  changeItemInfo,
  deleteCartItem,
} from '../store/reducers/CartReducer';
import {ScreenNames} from '../navigation/ScreenNames';
import {
  findDriver,
  updateDeliveryStatus,
} from '../store/reducers/DriverReducer';
import {getSelectedAddress} from '../store/selectors/AddressSelectors';
import PickAddress from '../components/PickAddress';
import {storeSelectedAddress} from '../store/reducers/AddressReducer';
import {DRIVER_STATUS} from '../store/reducers/DeliveryModeReducer';

const GroceryListScreen = ({
  route: {
    params: {selectedShop},
  },
  navigation,
}) => {
  const {store} = useContext(ReactReduxContext);
  const [list, setList] = useState(getCartItems(store.getState()));
  const [pickAddressModalVisible, setPickAddressModalVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(
    getSelectedAddress(store.getState()),
  );
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setList(getCartItems(store.getState()));
      setSelectedAddress(getSelectedAddress(store.getState()));
    });
    return () => {
      unsubscribe();
    };
  }, [store]);

  const renderItem = ({item, index}) => {
    return (
      <View style={{alignItems: 'center', flexDirection: 'row'}}>
        <TextInput
          value={item.item}
          onChangeText={text =>
            store.dispatch(
              changeItemInfo({
                index: index,
                quantity: list[index].quantity,
                item: text,
              }),
            )
          }
          placeholder={`Item ${index + 1}`}
          placeholderTextColor={colors.greyDarker}
          style={styles.inputField}
          keyboardType="ascii-capable"
          inputMode="text"
        />
        <View style={{alignItems: 'center', flexDirection: 'row'}}>
          <TouchableOpacity
            onPress={() => {
              if (item.quantity === 1) {
                store.dispatch(deleteCartItem({index}));
              } else {
                store.dispatch(
                  changeItemInfo({
                    index: index,
                    quantity: list[index].quantity - 1,
                    item: list[index].item,
                  }),
                );
              }
            }}>
            <MaterialCommunityIcons
              name={
                item.quantity === 1
                  ? 'delete-alert-outline'
                  : 'minus-box-outline'
              }
              color={colors.tertiaryBlueLight}
              size={30}
            />
          </TouchableOpacity>
          <Label text={item.quantity} textStyle={styles.itemQuantity} />
          <TouchableOpacity
            onPress={() => {
              store.dispatch(
                changeItemInfo({
                  index: index,
                  quantity: list[index].quantity + 1,
                  item: list[index].item,
                }),
              );
            }}>
            <MaterialCommunityIcons
              name={'plus-box-outline'}
              color={colors.tertiaryBlueLight}
              size={30}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const validateAndFindDriver = () => {
    console.log('list: ', list);
    const filteredList = list.filter(item => item.item && item.quantity !== 0);
    if (!filteredList.length) {
      Alert.alert('Empty list', 'Please add add atleast one item in the list');
      return;
    }
    Alert.alert(
      'Delivery charges',
      'Delivery charges would be non-refundable if the you decide to cancel the order once the delivery agent has started moving',
      [
        {
          isPreferred: true,
          style: 'default',
          text: 'Find your delivery agent',
          onPress: () => {
            store.dispatch(
              findDriver({
                selectedShop,
                deliveryLocation: selectedAddress,
                list,
              }),
            );
            store.dispatch(
              updateDeliveryStatus({
                deliveryStatus: DRIVER_STATUS.FINDING_DRIVERS,
              }),
            );
            navigation.navigate(ScreenNames.DELIVERY_SCREEN, {
              selectedShop,
              list,
              deliveryLocation: selectedAddress,
            });
          },
        },
        {style: 'cancel', text: 'Go back'},
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View
        style={{
          ...styles.selectedShopContainer,
          borderColor: colors.primary,
          marginBottom: 8,
        }}>
        <Label text={'Ordering from: '} textStyle={styles.orderingFrom} />
        <Label text={selectedShop.name} textStyle={styles.shopName} />
        <Label text={selectedShop.vicinity} textStyle={styles.shopAddress} />
      </View>
      <TouchableOpacity
        onPress={() => {
          setPickAddressModalVisible(true);
        }}
        style={{
          ...styles.selectedShopContainer,
          borderColor: colors.secondary,
          marginTop: 8,
        }}>
        <Label
          text={selectedAddress ? 'Deliver to: ' : 'Select delivery address'}
          textStyle={styles.orderingFrom}
        />
        {selectedAddress ? (
          <>
            <Label
              text={selectedAddress.address.name}
              textStyle={styles.shopName}
            />
            <Label
              text={selectedAddress.address.value}
              textStyle={styles.shopAddress}
            />
          </>
        ) : null}
      </TouchableOpacity>

      <KeyboardAwareFlatList
        data={list}
        keyboardDismissMode="interactive"
        ListFooterComponent={() => (
          <>
            <Button
              onPress={() => {
                store.dispatch(addItem({item: {item: '', quantity: 1}}));
              }}
              text={'Add item'}
              style={styles.addItemButton}
              textStyle={styles.addItemText}
            />
          </>
        )}
        renderItem={renderItem}
        style={{width: '100%'}}
      />
      <Button
        disabled={!list.filter(item => item.item && item.quantity !== 0).length}
        onPress={validateAndFindDriver}
        text={'Find your delivery agent'}
        style={{
          ...styles.findDriverButton,
          backgroundColor: list.filter(item => item.item && item.quantity !== 0)
            .length
            ? colors.secondary
            : colors.greyDark,
        }}
        textStyle={styles.findDriverText}
      />
      {!list.length ? (
        <Label
          text={'You have no items, please add atleast one item'}
          textStyle={styles.noItemText}
        />
      ) : null}
      <PickAddress
        mapTitle={'Pick delivery location'}
        onConfirmButtonPress={(isNewAddress, location) => {
          console.log('pressed: ', isNewAddress, location);
          if (isNewAddress) {
            setPickAddressModalVisible(false);
            navigation.navigate(ScreenNames.ADD_ADDRESS, {
              location,
              confirmCallback: ({address, location}) => {
                const {apartment, floor, house, instructions, title} = address;
                store.dispatch(
                  storeSelectedAddress({
                    address: {
                      buildingDetails: `${floor}, ${house}, ${apartment}`,
                      instructions,
                      name: title,
                      value: `${location.address.name} ${location.address.value}`,
                    },
                    coords: location.coords,
                  }),
                );
              },
            });
          } else {
            store.dispatch(storeSelectedAddress(location));
            setPickAddressModalVisible(false);
          }
        }}
        setModalVisible={setPickAddressModalVisible}
        title={'Place this pin to delivery location'}
        visible={pickAddressModalVisible}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  addItemButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: 16,
    padding: 16,
    width: '100%',
  },
  addItemText: {
    color: colors.white,
    fontSize: 20,
  },
  container: {
    alignItems: 'center',
    backgroundColor: colors.white,
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  findDriverButton: {
    alignItems: 'center',
    backgroundColor: colors.tertiaryBlue,
    borderRadius: 12,
    justifyContent: 'center',
    bottom: 16,
    padding: 16,
    position: 'absolute',
    width: '100%',
  },
  findDriverText: {
    color: colors.white,
    fontSize: 20,
  },
  inputField: {
    backgroundColor: colors.greyLight,
    borderRadius: 12,
    color: colors.black,
    flex: 1,
    fontSize: 16,
    marginVertical: 8,
    marginRight: 8,
    padding: 16,
  },
  itemQuantity: {
    fontSize: 20,
    marginHorizontal: 4,
  },
  noItemText: {
    alignSelf: 'center',
    color: colors.greyDark,
    fontSize: 16,
    bottom: 96,
    position: 'absolute',
  },
  orderingFrom: {
    color: colors.black,
    fontSize: 16,
  },
  selectedShopContainer: {
    alignItems: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: '100%',
  },
  shopName: {
    color: colors.black,
    fontSize: 18,
    fontWeight: 'bold',
  },
  shopAddress: {
    color: colors.black,
    fontSize: 16,
  },
});

export default GroceryListScreen;
