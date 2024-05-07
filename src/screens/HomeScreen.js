import React, {useContext, useEffect, useRef, useState} from 'react';
import {
  AppState,
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {ReactReduxContext} from 'react-redux';

import colors from '../config/colors';
import {ScreenNames} from '../navigation/ScreenNames';
import Label from '../components/Label';
import Loader from '../components/Loader/Loader';
import {
  getAddresses,
  storeSelectedAddress,
} from '../store/reducers/AddressReducer';
import {
  getAddressLoading,
  getAddresses as getSavedAddresses,
} from '../store/selectors/AddressSelectors';
import PickAddress from '../components/PickAddress';
import {getDeliveryMode} from '../store/selectors/DeliveryModeSelectors';
import {startBgTask, stopBgTask} from '../utils/backgroundTask';

const HomeScreen = ({navigation}) => {
  const {store} = useContext(ReactReduxContext);
  const appState = useRef(AppState.currentState);
  const [selectedAddress, setSelectedAddress] = useState(
    getSavedAddresses(store.getState())[0],
  );
  const [pickAddressModalVisible, setPickAddressModalVisible] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState(
    getDeliveryMode(store.getState()),
  );
  const [addressLoading, setAddressLoading] = useState(
    getAddressLoading(store.getState()),
  );
  useEffect(() => {
    navigation.setOptions({
      header: () => {
        return (
          <View style={styles.headerContainer}>
            {selectedAddress?.address ? (
              <TouchableOpacity
                onPress={() => setPickAddressModalVisible(true)}
                style={styles.addressContainer}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={32}
                  color={colors.white}
                />
                <Label
                  text={selectedAddress.address.name}
                  textStyle={styles.addressText}
                />

                <MaterialCommunityIcons
                  name="menu-down"
                  size={28}
                  color={colors.white}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setPickAddressModalVisible(true)}
                style={{
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  marginLeft: 16,
                }}>
                {/*   <Label text={'Add address'} textStyle={styles.addressText} /> */}
                <MaterialCommunityIcons
                  name="map-marker"
                  color={colors.white}
                  size={28}
                />
                <MaterialCommunityIcons
                  name="plus"
                  color={colors.white}
                  size={28}
                />
              </TouchableOpacity>
            )}
            <View
              style={{
                position: 'absolute',
                alignSelf: 'center',
                justifyContent: 'center',
                alignItems: 'center',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                zIndex: -1,
              }}>
              <Label text={'DTU'} textStyle={styles.addressText} />
            </View>
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
  }, [deliveryMode, navigation, selectedAddress?.address]);

  const useCases = [
    {
      image: require('../assets/images/grocery.jpeg'),
      key: 'buyGroceries',
      title: 'Buy Groceries',
      navigateTo: ScreenNames.GROCERY_SCREEN,
    },

    {
      image: require('../assets/images/receiveParcel.jpeg'),
      key: 'sendParcel',
      title: 'Send Mail',
      navigateTo: ScreenNames.PARCEL_SCREEN,
      navOptions: {isSendParcel: true},
    },
    {
      image: require('../assets/images/sendParcel.jpeg'),
      key: 'receiveParcel',
      title: 'Receive Mail',
      navigateTo: ScreenNames.PARCEL_SCREEN,
      navOptions: {isSendParcel: false},
    },
  ];

  useEffect(() => {
    setTimeout(() => store.dispatch(getAddresses()));
    stopBgTask();
  }, [store]);

  /* useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground!');
        stopBgTask();
      } else {
        console.log('App has gone to background!');
        startBgTask();
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, []); */

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setAddressLoading(getAddressLoading(store.getState()));
      setDeliveryMode(getDeliveryMode(store.getState()));
      if (!selectedAddress) {
        setSelectedAddress(getSavedAddresses(store.getState())[0]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [selectedAddress, store]);

  useEffect(() => {
    if (selectedAddress) {
      store.dispatch(storeSelectedAddress(selectedAddress));
    }
  }, [selectedAddress, store]);

  return (
    <View style={{backgroundColor: colors.white, flex: 1}}>
      <View style={styles.container}>
        {useCases.map((useCase, index) => {
          return (
            <TouchableOpacity
              key={index.toString()}
              onPress={() =>
                navigation.navigate(useCase.navigateTo, {
                  ...(useCase.navOptions || {}),
                })
              }
              style={{
                ...styles.useCaseButtonContainer,
                backgroundColor:
                  index % 2 === 0 ? colors.secondary : colors.white,
                borderColor: index % 2 === 0 ? colors.white : colors.secondary,
              }}>
              <Label
                text={useCase.title}
                textStyle={{
                  ...styles.useCaseText,
                  color: index % 2 === 0 ? colors.white : colors.secondary,
                }}
                multiline
              />
              <MaterialCommunityIcons
                color={index % 2 === 0 ? colors.white : colors.secondary}
                name="arrow-right-circle"
                size={24}
              />
              {useCase.image ? (
                <Image
                  source={useCase.image}
                  style={{
                    height: '50%',
                    marginTop: 16,
                    width: '100%',
                    position: 'absolute',
                    bottom: 0,
                  }}
                />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
      <TouchableOpacity
        onPress={() => navigation.navigate(ScreenNames.CAR_RENT_SCREEN)}
        style={styles.uberContainer}>
        <Label
          text={'Get a private cab'}
          textStyle={{
            ...styles.useCaseText,
            color: colors.white,
          }}
          multiline
        />
        <MaterialCommunityIcons
          color={colors.white}
          name="arrow-right-circle"
          size={24}
        />
        <Image
          source={require('../assets/images/blackCar.png')}
          style={{
            height: '50%',
            marginTop: 16,
            width: '100%',
            position: 'absolute',
            bottom: 16,
          }}
        />
      </TouchableOpacity>
      <PickAddress
        mapTitle={'Add location'}
        onConfirmButtonPress={(isNewAddress, location) => {
          console.log('pressed: ', isNewAddress, location);
          if (isNewAddress) {
            setPickAddressModalVisible(false);
            navigation.navigate(ScreenNames.ADD_ADDRESS, {location});
          } else {
            setSelectedAddress(location);
            setPickAddressModalVisible(false);
          }
        }}
        setModalVisible={setPickAddressModalVisible}
        title={'Place this pin to delivery location'}
        visible={pickAddressModalVisible}
      />
      <Loader visible={addressLoading} from="HomeScreen" />
    </View>
  );
};

const styles = StyleSheet.create({
  addressContainer: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginLeft: 16,
  },
  addressText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  container: {
    backgroundColor: colors.white,
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  headerContainer: {
    alignItems: 'center',
    backgroundColor: colors.tertiary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    width: '100%',
  },
  profileButton: {
    flexDirection: 'row',
    marginRight: 16,
  },
  uberContainer: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 16,
    height: '50%',
    margin: 16,
    width: Dimensions.get('window').width - 32,
  },
  useCaseButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  useCaseButtonContainer: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    flex: 1,
    height: 220,
    justifyContent: 'flex-start',
    marginHorizontal: 4,
    overflow: 'hidden',
  },
  useCaseText: {
    fontSize: 16,
    marginBottom: 8,
    margin: 16,
    textAlign: 'center',
  },
});

export default HomeScreen;
