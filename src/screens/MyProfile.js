import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import VersionInfo from 'react-native-version-info';
import colors from '../config/colors';
import Label from '../components/Label';
import {ScreenNames} from '../navigation/ScreenNames';
import Address from '../components/Address';
import PickAddress from '../components/PickAddress';
import {
  getDeliveryMode,
  getDeliveryModeLoading,
  getIsOnBoarded,
} from '../store/selectors/DeliveryModeSelectors';
import {ReactReduxContext} from 'react-redux';
import {deleteAddress} from '../store/reducers/AddressReducer';
import {getAddressLoading} from '../store/selectors/AddressSelectors';
import {
  setDeliveryModeLoading,
  switchDeliveryMode,
} from '../store/reducers/DeliveryModeReducer';
import {getUserData} from '../store/selectors/UserSelectors';
import {SelectItem} from './CarRentScreen';
import ParcelContent, {carRentItems} from '../components/ParcelContent';
import {changeVehicleType} from '../utils/driverFunctions';
import {logout} from '../utils/logout';
import Loader from '../components/Loader/Loader';

const MenuItem = ({iconname, onPress, text}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.5}
      onPress={onPress}
      style={styles.menuItemContainer}>
      <MaterialCommunityIcons
        name={iconname}
        color={colors.secondary}
        size={32}
      />
      <Label text={text} textStyle={styles.menuItemText} />
    </TouchableOpacity>
  );
};

const MyProfile = ({navigation}) => {
  const {store} = useContext(ReactReduxContext);
  const [savedAddressesVisible, setSavedAddressesVisible] = useState(false);
  const [pickAddressModalVisible, setPickAddressModalVisible] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [deliveryModaLoading, setDeliveryLoading] = useState(false);
  const [switchToDeliveryMode, setSwitchToDeliveryMode] = useState(
    getDeliveryMode(store.getState()),
  );
  const [switchCarRentMode, setSwitchCarRentMode] = useState(
    getUserData(store.getState()).isUberDriver,
  );
  const [vehicleTypeModalVisible, setVehicleTypeModalVisible] = useState(false);
  const [vehicleType, setVehicleType] = useState(
    [
      carRentItems.find(
        item => item.value === getUserData(store.getState()).vehicleType,
      ),
    ].filter(item => item),
  );
  const [isAlreadyADriver, setIsAlreadyADriver] = useState(
    getIsOnBoarded(store.getState()),
  );

  const [user, setUser] = useState(getUserData(store.getState()));

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setSwitchToDeliveryMode(getDeliveryMode(store.getState()));
      setAddressLoading(getAddressLoading(store.getState()));
      setIsAlreadyADriver(getIsOnBoarded(store.getState()));
      setUser(getUserData(store.getState()));
      setDeliveryLoading(getDeliveryModeLoading(store.getState()));
    });

    return () => {
      unsubscribe();
    };
  }, [store]);

  useEffect(() => {
    if (vehicleType?.[0]?.value) {
      changeVehicleType({
        vehicleType: vehicleType[0].value,
        isUberDriver: switchCarRentMode,
      });
    }
  }, [switchCarRentMode, vehicleType]);

  const changeDeliveryMode = useCallback(
    value => {
      if (value && !isAlreadyADriver) {
        navigation.navigate(ScreenNames.DRIVER_ONBOARDING_SCREEN);
      } else {
        store.dispatch(setDeliveryModeLoading({deliveryModeLoading: true}));
        store.dispatch(switchDeliveryMode({deliveryMode: value}));
      }
    },
    [isAlreadyADriver, navigation, store],
  );

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.titleContainer}>
          <Label
            text={`Hi, ${user.firstName} ${user.lastName}!`}
            textStyle={styles.titletext}
          />
          <Image
            source={require('../assets/profile.jpeg')}
            style={styles.profileImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.subTitleContainer}>
          <MaterialCommunityIcons
            name={'phone'}
            color={colors.greyDark}
            size={16}
          />
          <Label text={`${user.mobileNumber}`} textStyle={styles.subTitle} />
        </View>
        <View style={styles.subTitleContainer}>
          <MaterialCommunityIcons
            name={'email'}
            color={colors.greyDark}
            size={16}
          />
          <Label text={user.email} textStyle={styles.subTitle} />
        </View>

        <View style={styles.menuItems}>
          <MenuItem
            iconname={'map-marker-radius-outline'}
            onPress={() => setSavedAddressesVisible(true)}
            text={'Saved Addresses'}
          />
          {/*  <MenuItem iconname={'lifebuoy'} onPress={() => {}} text={'Support'} />
          <MenuItem
            iconname={'information-outline'}
            onPress={() => {}}
            text={'About'}
          /> */}
          <View style={styles.deliveryModeContainer}>
            <MenuItem
              iconname={'truck-delivery'}
              onPress={() => changeDeliveryMode(!switchToDeliveryMode)}
              text={`Switch ${
                switchToDeliveryMode ? 'off' : 'on'
              } delivery mode`}
            />
            <Switch
              onValueChange={changeDeliveryMode}
              trackColor={{false: colors.neutralGrey, true: colors.greyDark}}
              value={switchToDeliveryMode}
              thumbColor={colors.primary}
            />
          </View>
          {switchToDeliveryMode ? (
            <View style={styles.deliveryModeContainer}>
              <MenuItem
                iconname={'car-multiple'}
                onPress={() => setSwitchCarRentMode(!switchCarRentMode)}
                text={`Switch ${
                  switchCarRentMode ? 'off' : 'on'
                } car rent mode`}
              />
              <Switch
                onValueChange={setSwitchCarRentMode}
                trackColor={{false: colors.neutralGrey, true: colors.greyDark}}
                value={switchCarRentMode}
                thumbColor={colors.primary}
              />
            </View>
          ) : null}
          {switchCarRentMode && switchToDeliveryMode ? (
            <>
              <SelectItem
                description={
                  vehicleType.length
                    ? vehicleType[0]?.name
                    : 'e.g. Small class, Large class'
                }
                onPress={() => {
                  setVehicleTypeModalVisible(true);
                }}
                style={{marginBottom: 32, marginTop: 4}}
                selected={vehicleType.length}
                title={'Select car class'}
              />
              <ParcelContent
                carRent={true}
                onModalClose={() => setVehicleTypeModalVisible(false)}
                onSelectItem={setVehicleType}
                preSelectedItems={vehicleType || []}
                visible={vehicleTypeModalVisible}
              />
            </>
          ) : null}
        </View>
        <MenuItem
          iconname={'logout'}
          onPress={() => logout(navigation)}
          text={'Logout'}
        />
        <Label
          text={`Version ${VersionInfo.appVersion}`}
          textStyle={styles.versionText}
        />
        <Address
          addAddressAction={() => {
            setTimeout(() => {
              setPickAddressModalVisible(true);
            }, 500);
          }}
          loading={addressLoading}
          onAddressSelect={item => {
            store.dispatch(deleteAddress({address: item}));
          }}
          showAddressModal={savedAddressesVisible}
          setShowAddressModal={setSavedAddressesVisible}
        />
        <PickAddress
          mapTitle={'Add location'}
          onConfirmButtonPress={(isNewAddress, location) => {
            console.log('pressed: ', isNewAddress, location);
            if (isNewAddress) {
              setPickAddressModalVisible(false);
              navigation.navigate(ScreenNames.ADD_ADDRESS, {location});
            } else {
              setPickAddressModalVisible(false);
            }
          }}
          setModalVisible={setPickAddressModalVisible}
          title={'Place this pin to delivery location'}
          visible={pickAddressModalVisible}
        />
      </ScrollView>
      <Loader visible={deliveryModaLoading} from="MyProfile" />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    flex: 1,
    padding: 16,
  },
  dash: {
    backgroundColor: colors.neutralGrey,
    height: 2,
    marginBottom: 16,
    width: '100%',
  },
  deliveryModeContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  menuItemContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 16,
  },
  menuItems: {
    marginTop: 48,
  },
  menuItemText: {
    color: colors.black,
    fontSize: 16,
    marginLeft: 16,
  },
  profileImage: {
    borderColor: colors.secondary,
    borderRadius: 50,
    borderWidth: 2,
    height: 50,
    marginRight: 16,
    width: 50,
  },
  savedAddressContainer: {
    backgroundColor: colors.white,
    bottom: 0,
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
  savedAddressHeader: {
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
  savedAddressHeaderText: {
    color: colors.black,
    fontSize: 18,
  },
  subTitle: {
    color: colors.greyDark,
    fontSize: 16,
    marginLeft: 16,
  },
  subTitleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 4,
  },
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titletext: {
    color: colors.black,
    fontSize: 24,
  },
  versionText: {
    color: colors.greyDark,
    fontSize: 14,
    marginTop: 16,
  },
});

export default MyProfile;
