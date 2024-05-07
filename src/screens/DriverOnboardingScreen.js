import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import CaptureImage from '../components/CaptureImage';
import colors from '../config/colors';
import Label from '../components/Label';
import Button from '../components/Button';
import {ScreenNames} from '../navigation/ScreenNames';
import {callOnboardingApi} from '../components/CaptureImage/utils';
import ParcelContent from '../components/ParcelContent';
import {SelectItem} from './CarRentScreen';
import CheckBox from '@react-native-community/checkbox';

const DriverOnboardingScreen = ({navigation}) => {
  const [onBoardingLoading, setOnboardingLoading] = useState(false);
  const [drivingLicence, setDrivingLicence] = useState('');
  const [vehicleNumberPlate, setVehicleNumberPlate] = useState('');
  const [vehicleType, setVehicleType] = useState([]);
  const [vehicleTypeModalVisible, setVehicleTypeModalVisible] = useState(false);
  const [acceptCarRent, setAcceptCarRent] = useState(false);
  const [photoUrl, setPhotoUrl] = useState({
    driver: null,
    drivingLicense: null,
    vehicle: null,
    numberPlate: null,
  });

  const PhotoUpload = ({
    boxSubtitle,
    boxTitle,
    captureButtonStyle = {},
    cropHeight = 250,
    cropWidth = 322,
    photoContainerStyle = {},
    photoUrl,
    photoTitle,
    reCaptureButtonStyle = {},
    setPhotoUrl,
  }) => {
    return (
      <View style={{marginBottom: 16, width: '100%'}}>
        <Label text={photoTitle} textStyle={styles.photoTitleText} />
        <View style={{...styles.capturePhotoContainer, ...photoContainerStyle}}>
          {photoUrl ? (
            <Image
              source={{uri: photoUrl}}
              style={{...styles.image, ...photoContainerStyle}}
            />
          ) : (
            <>
              <Text style={styles.licenceText}>
                <Label
                  text={boxTitle}
                  textStyle={styles.photoInstructionBold}
                />
                <Label
                  multiline
                  text={boxSubtitle}
                  textStyle={styles.photoInstruction}
                />
              </Text>
              <CaptureImage
                cropStyle={{cropHeight, cropWidth}}
                setPhotoUrl={setPhotoUrl}
                style={{...styles.captureButton, ...captureButtonStyle}}
                text={`${photoUrl ? 'Re-' : ''}Capture`}
              />
            </>
          )}
        </View>
        {photoUrl ? (
          <CaptureImage
            cropStyle={{cropHeight, cropWidth}}
            setPhotoUrl={setPhotoUrl}
            style={{...styles.captureButton, ...reCaptureButtonStyle}}
            text={`${photoUrl ? 'Re-' : ''}Capture`}
          />
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Label text={'Document submission'} textStyle={styles.title} />
        <Label
          text={'To start on-boarding, please upload a focused photo of'}
          textStyle={styles.subTitle}
        />
      </View>
      <ScrollView style={{width: '100%', marginBottom: 58}}>
        <PhotoUpload
          boxTitle={'Your selfie.'}
          boxSubtitle={' Please keep your eyes open'}
          captureButtonStyle={{paddingHorizontal: 12}}
          cropHeight={175}
          cropWidth={175}
          photoContainerStyle={{borderRadius: 100, height: 175, width: 175}}
          photoTitle={'1. Yourself'}
          reCaptureButtonStyle={{paddingHorizontal: 12, width: 175}}
          photoUrl={photoUrl.driver}
          setPhotoUrl={url =>
            setPhotoUrl(prevValue => ({...prevValue, driver: url}))
          }
        />
        <View style={styles.dash} />
        <PhotoUpload
          boxTitle={'Front side photo'}
          boxSubtitle={
            ' of your driver licence with your clear name and licence number'
          }
          photoTitle={"2. Driver's licence"}
          photoUrl={photoUrl.drivingLicense}
          setPhotoUrl={url =>
            setPhotoUrl(prevValue => ({...prevValue, drivingLicense: url}))
          }
        />
        <TextInput
          value={drivingLicence}
          onChangeText={text => setDrivingLicence(text)}
          placeholder="Enter your Driver's licence number"
          placeholderTextColor={colors.greyDarker}
          style={styles.vehicleInfoInput}
          keyboardType="default"
          inputMode="text"
        />
        <View style={styles.dash} />
        <PhotoUpload
          photoTitle={"3. Your vehicle's number plate"}
          boxTitle={'Number plate'}
          boxSubtitle={' of your vehicle with complete number clearly visible'}
          photoUrl={photoUrl.numberPlate}
          setPhotoUrl={url =>
            setPhotoUrl(prevValue => ({...prevValue, numberPlate: url}))
          }
        />
        <TextInput
          value={vehicleNumberPlate}
          onChangeText={text => setVehicleNumberPlate(text)}
          placeholder="Enter your vehicle's reg. number"
          placeholderTextColor={colors.greyDarker}
          style={styles.vehicleInfoInput}
          keyboardType="default"
          inputMode="text"
        />
        <View style={styles.dash} />
        <PhotoUpload
          photoTitle={'4. Your vehicle'}
          boxTitle={"Full vehicle's photo"}
          boxSubtitle={' in which it is completely visible'}
          photoUrl={photoUrl.vehicle}
          setPhotoUrl={url =>
            setPhotoUrl(prevValue => ({...prevValue, vehicle: url}))
          }
        />
        {acceptCarRent ? (
          <>
            <SelectItem
              description={
                vehicleType.length
                  ? vehicleType[0].name
                  : 'e.g. Small class, Large class'
              }
              onPress={() => {
                setVehicleTypeModalVisible(true);
              }}
              style={{marginBottom: 32, marginTop: 4}}
              selected={vehicleType.length}
              title={'Select car class'}
            />
            <View style={styles.dash} />
            <ParcelContent
              carRent={true}
              onModalClose={() => setVehicleTypeModalVisible(false)}
              onSelectItem={setVehicleType}
              preSelectedItems={vehicleType}
              visible={vehicleTypeModalVisible}
            />
          </>
        ) : null}
        <View style={styles.checkBoxContainer}>
          <CheckBox
            disabled={true}
            onCheckColor={colors.greyDark}
            onTintColor={colors.greyDark}
            value={true}
            tintColors={{false: colors.greyDark, true: colors.greyDark}}
          />
          <Label
            text={"I'll accept parcel and grocery deliveries"}
            textStyle={{...styles.TnCText, color: colors.greyDark}}
          />
        </View>
        <View style={styles.checkBoxContainer}>
          <CheckBox
            disabled={false}
            onCheckColor={colors.secondary}
            onTintColor={colors.secondary}
            onValueChange={carRent => setAcceptCarRent(carRent)}
            value={acceptCarRent}
            tintColors={{false: colors.black, true: colors.secondary}}
          />
          <Label
            multiline
            text={"I'll also accept car rent trips"}
            textStyle={styles.TnCText}
          />
        </View>
      </ScrollView>
      {onBoardingLoading ? (
        <ActivityIndicator
          style={{
            ...styles.submitButton,
            backgroundColor: colors.secondary,
          }}
          color={colors.white}
          size={'small'}
        />
      ) : (
        <Button
          activeOpacity={0.5}
          disabled={
            !(
              photoUrl.driver &&
              photoUrl.drivingLicense &&
              photoUrl.numberPlate &&
              photoUrl.vehicle &&
              drivingLicence &&
              vehicleNumberPlate &&
              (acceptCarRent ? vehicleType.length : true)
            )
          }
          onPress={() => {
            setOnboardingLoading(true);
            callOnboardingApi({
              ...photoUrl,
            })
              .then(url => {
                setOnboardingLoading(false);
                navigation.navigate(ScreenNames.WEBVIEW_SCREEN, {
                  url,
                  title: 'Onboarding',
                  licenseNumber: drivingLicence,
                  vehicleNumber: vehicleNumberPlate,
                  vehicleType: vehicleType[0],
                });
              })
              .catch(error => {
                setOnboardingLoading(false);
                Alert.alert('Error in onboarding', error);
              });
          }}
          style={{
            ...styles.submitButton,
            backgroundColor:
              photoUrl.driver &&
              photoUrl.drivingLicense &&
              photoUrl.numberPlate &&
              photoUrl.vehicle &&
              drivingLicence &&
              vehicleNumberPlate &&
              (acceptCarRent ? vehicleType.length : true)
                ? colors.secondary
                : colors.greyDark,
          }}
          text={'Start On-boarding'}
          textStyle={styles.submitButtonText}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  captureButton: {
    marginTop: 16,
  },
  capturePhotoContainer: {
    alignItems: 'center',
    borderColor: colors.neutralGrey,
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    justifyContent: 'center',
    marginLeft: 16,
    padding: 16,
    height: 250,
    width: 322,
    marginTop: 16,
  },
  checkBoxContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 32,
    marginBottom: 16,
    width: '100%',
  },
  container: {
    alignItems: 'center',
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
  image: {
    borderColor: colors.black,
    borderRadius: 8,
    borderWidth: 1,
    height: 250,
    width: 322,
  },
  licenceText: {
    textAlign: 'center',
    width: '100%',
  },
  photoInstruction: {
    color: colors.greyDark,
    fontSize: 14,
  },
  photoInstructionBold: {
    color: colors.black,
    fontSize: 14,
    fontWeight: 'bold',
  },
  photoTitleText: {
    color: colors.black,
    fontSize: 16,
  },
  submitButton: {
    alignItems: 'center',
    borderRadius: 100,
    bottom: 16,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'absolute',
    width: '100%',
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 18,
  },
  subTitle: {
    color: colors.greyDark,
    fontSize: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  title: {
    color: colors.black,
    fontSize: 22,
    fontWeight: 'bold',
  },
  titleContainer: {
    alignItems: 'flex-start',
    width: '100%',
  },
  TnCText: {
    color: colors.black,
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  vehicleInfoInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutralGrey,
    color: colors.black,
    fontSize: 18,
    marginBottom: 16,
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: '80%',
  },
});

export default DriverOnboardingScreen;
