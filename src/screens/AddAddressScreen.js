import React, {useContext, useEffect, useState} from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import colors from '../config/colors';
import Button from '../components/Button';
import {validateAddress} from '../utils/validateAddress';
import {ReactReduxContext} from 'react-redux';
import {addAddress, getAddresses} from '../store/reducers/AddressReducer';
import {getAddressLoading} from '../store/selectors/AddressSelectors';
import Loader from '../components/Loader/Loader';
import Label from '../components/Label';

const AddAddressScreen = ({
  navigation,
  route: {
    params: {location, confirmCallback = () => {}},
  },
}) => {
  const [address, setAddress] = useState({
    house: '',
    floor: '',
    apartment: '',
    instructions: '',
    title: '',
  });
  const [addAddressLoading, setAddressLoading] = useState(false);
  const [enableButton, setEnableButton] = useState(false);
  const [showOtherName, setShowOtherName] = useState(false);
  const {store} = useContext(ReactReduxContext);

  useEffect(() => {
    validateAddress({
      address,
      failureCallback: () => setEnableButton(false),
      successCallback: () => setEnableButton(true),
    });
  }, [address]);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setAddressLoading(getAddressLoading(store.getState()));
    });
    return () => {
      unsubscribe();
    };
  }, [store]);
  return (
    <View style={{backgroundColor: colors.white, flex: 1}}>
      <View style={styles.mapLocation}>
        <View style={styles.mapLocationTextContainer}>
          <Label
            text={location.address.name}
            textStyle={styles.mapAddressName}
          />
          <Label
            text={location.address.value}
            textStyle={styles.mapAddressValue}
          />
        </View>
        <Button
          text="Change"
          textStyle={styles.changeMapLocationText}
          style={styles.changeMapLocationButton}
        />
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{paddingVertical: 16}}>
        <TextInput
          value={address.house}
          onChangeText={house => setAddress(details => ({...details, house}))}
          placeholder="House/Flat no*"
          placeholderTextColor={colors.greyDarker}
          style={styles.inputField}
          keyboardType="ascii-capable"
          inputMode="text"
        />
        <TextInput
          value={address.floor}
          onChangeText={floor => setAddress(details => ({...details, floor}))}
          placeholder="Floor number"
          placeholderTextColor={colors.greyDarker}
          style={styles.inputField}
          keyboardType="numeric"
          inputMode="numeric"
        />
        <TextInput
          value={address.apartment}
          onChangeText={apartment =>
            setAddress(details => ({...details, apartment}))
          }
          placeholder="Apartment/Building name"
          placeholderTextColor={colors.greyDarker}
          style={styles.inputField}
          keyboardType="ascii-capable"
          inputMode="text"
          textContentType="addressCityAndState"
          autoComplete="country"
        />
        <View>
          <Label
            text={'How to reach (Optional)'}
            textStyle={styles.howToReach}
          />
          <TextInput
            value={address.instructions}
            onChangeText={instructions =>
              setAddress(details => ({
                ...details,
                instructions: instructions.substring(0, 100),
              }))
            }
            style={{
              ...styles.inputField,
              height: 120,
              marginTop: 4,
              paddingTop: 16,
            }}
            keyboardType="ascii-capable"
            inputMode="text"
            textContentType="addressCityAndState"
            autoComplete="country"
            multiline={true}
            textAlignVertical="top"
          />
          <Label
            text={`${address.instructions.length}/100`}
            textStyle={styles.characterCount}
          />
        </View>
        <Label
          text={'Save this address as*'}
          textStyle={styles.saveAddressAs}
        />
        <View style={styles.addressNameContainer}>
          <Button
            activeOpacity={1}
            onPress={() => {
              setShowOtherName(false);
              setAddress(prevValue => ({...prevValue, title: 'Home'}));
            }}
            text={'HOME'}
            textStyle={{
              ...styles.addressNameText,
              color:
                address.title === 'Home' ? colors.secondary : colors.greyDark,
            }}
            style={{
              ...styles.addressNameButton,
              borderColor:
                address.title === 'Home' ? colors.secondary : colors.greyDark,
            }}
          />
          <Button
            activeOpacity={1}
            onPress={() => {
              setShowOtherName(false);
              setAddress(prevValue => ({...prevValue, title: 'Office'}));
            }}
            text={'OFFICE'}
            textStyle={{
              ...styles.addressNameText,
              color:
                address.title === 'Office' ? colors.secondary : colors.greyDark,
            }}
            style={{
              ...styles.addressNameButton,
              borderColor:
                address.title === 'Office' ? colors.secondary : colors.greyDark,
            }}
          />
          <Button
            activeOpacity={1}
            onPress={() => {
              setShowOtherName(!showOtherName);
              setAddress(prevValue => ({...prevValue, title: ''}));
            }}
            text={'OTHERS'}
            textStyle={{
              ...styles.addressNameText,
              color: showOtherName ? colors.secondary : colors.greyDark,
            }}
            style={{
              ...styles.addressNameButton,
              borderColor: showOtherName ? colors.secondary : colors.greyDark,
            }}
          />
        </View>
        {showOtherName ? (
          <TextInput
            value={address.title}
            onChangeText={title => setAddress(details => ({...details, title}))}
            placeholder="e.g. Jean's house, New office"
            placeholderTextColor={colors.greyDark}
            style={styles.inputField}
            keyboardType="ascii-capable"
            inputMode="text"
          />
        ) : null}
      </ScrollView>
      <Button
        disabled={!enableButton}
        onPress={() =>
          validateAddress({
            address,
            successCallback: () => {
              store.dispatch(
                addAddress({
                  address,
                  location,
                  successCallback: () => {
                    console.log('Calling add address success callback');
                    store.dispatch(getAddresses());
                    confirmCallback && confirmCallback({address, location});
                    navigation.pop();
                  },
                }),
              );
            },
          })
        }
        style={{
          ...styles.addAddressButton,
          backgroundColor: enableButton ? colors.secondary : colors.greyDark,
        }}
        text={'Add Address'}
        textStyle={styles.addAddressText}
      />
      <Loader visible={addAddressLoading} from="AddAddress" />
    </View>
  );
};

const styles = StyleSheet.create({
  addAddressButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    position: 'absolute',
    borderRadius: 100,
    bottom: 16,
    width: Dimensions.get('window').width - 32,
    marginLeft: 16,
    marginRight: 16,
  },
  addAddressText: {
    color: colors.white,
    fontSize: 16,
  },
  addressNameButton: {
    backgroundColor: colors.white,
    borderColor: colors.greyDark,
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 16,
  },
  addressNameText: {
    fontSize: 14,
  },
  addressNameContainer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  changeMapLocationButton: {
    backgroundColor: colors.white,
    borderColor: colors.neutralGrey,
    borderRadius: 100,
    borderWidth: 1,
    padding: 4,
  },
  changeMapLocationText: {
    color: colors.secondary,
  },
  characterCount: {
    color: colors.greyDark,
    bottom: 16,
    position: 'absolute',
    right: 16,
  },
  container: {
    backgroundColor: colors.white,
    flex: 1,
    paddingHorizontal: 16,
    marginBottom: 80,
  },
  howToReach: {
    color: colors.greyDark,
    fontSize: 14,
    marginTop: 24,
  },
  inputField: {
    color: colors.black,
    backgroundColor: colors.greyLight,
    borderRadius: 12,
    fontSize: 16,
    marginTop: 16,
    padding: 16,
    width: '100%',
  },
  mapAddressName: {
    color: colors.black,
    fontSize: 20,
  },
  mapAddressValue: {
    color: colors.greyDark,
    fontSize: 14,
  },
  mapLocation: {
    alignItems: 'center',
    backgroundColor: colors.lightGreen,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    width: '100%',
  },
  mapLocationTextContainer: {
    flex: 1,
  },
  saveAddressAs: {
    color: colors.greyDark,
    fontSize: 16,
    marginTop: 64,
  },
});

export default AddAddressScreen;
