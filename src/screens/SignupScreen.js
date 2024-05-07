import React, {useRef, useState} from 'react';
import {
  Alert,
  Image,
  Linking,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import CheckBox from '@react-native-community/checkbox';
import colors from '../config/colors';
import Button from '../components/Button';
import {secondsToWaitBeforeRequestingAgain} from '../utils/timer';
import {handleOTPRequest, validateOTP} from '../utils/otpFunctions';
import DatePicker from '../components/DateTimePicker';
import Loader from '../components/Loader/Loader';
import Label from '../components/Label';

const SignupScreen = ({navigation, route}) => {
  const [signUpDetails, setSignUpDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dob: '',
    contactNumber: '',
    TnC: false,
  });
  const [otp, setOtp] = useState(null);
  const [otpRequested, setOtpRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(secondsToWaitBeforeRequestingAgain);
  const [_id, set_id] = useState('');
  const [token, setToken] = useState('');
  const timerRef = useRef(timer);

  const validateDetails = () => {
    const keys = Object.keys(signUpDetails);
    if (!keys.length) {
      Alert.alert('Please fill all the required details');
      return;
    }
    let validDetails = 0;
    keys.some(key => {
      const value = signUpDetails[key];
      switch (key) {
        case 'firstName':
          if (value.trim() && value?.length >= 2) {
            validDetails++;
          } else {
            Alert.alert('Please enter a valid first name');
            return true;
          }
          break;
        case 'lastName':
          if (value.trim() && value?.length >= 2) {
            validDetails++;
          } else {
            Alert.alert('Please enter a valid last name');
            return true;
          }
          break;

        case 'email':
          if (value.trim() && /\S+@\S+\.\S+/.test(value)) {
            validDetails++;
          } else {
            Alert.alert('Please enter a valid email');
            return true;
          }
          break;
        case 'dob':
          console.log('value: ', value);
          if (value) {
            validDetails++;
          } else {
            Alert.alert('Please enter a valid date of birth');
            return true;
          }
          break;
        case 'TnC':
          if (value) {
            validDetails++;
          } else {
            Alert.alert(
              'Please accept our terms and conditions before proceeding',
            );
            return true;
          }
        case 'contactNumber':
          break;
        default:
          Alert.alert('Something is not right!');
          return true;
      }
    });
    if (validDetails === 5) {
      handleOTPRequest({
        contactNumber: signUpDetails.contactNumber,
        navigation,
        setOtpRequested,
        setLoading,
        timerRef,
        setTimer,
        signUpDetails,
        set_id,
        setToken,
      });
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.yellow}}>
      <Image
        resizeMode="cover"
        source={require('../assets/images/loginSignup.png')}
        style={styles.image}
      />
      <KeyboardAwareScrollView
        keyboardDismissMode="interactive"
        style={styles.container}
        contentContainerStyle={{paddingVertical: 16}}>
        <Label text="Get started with DriveThroughU" textStyle={styles.title} />
        <TextInput
          value={signUpDetails.firstName}
          onChangeText={firstName =>
            setSignUpDetails(details => ({...details, firstName}))
          }
          placeholder="First name*"
          placeholderTextColor={colors.greyDarker}
          style={styles.contactNumberInput}
          keyboardType="ascii-capable"
          inputMode="text"
          textContentType="name"
          autoComplete="name"
        />
        <TextInput
          value={signUpDetails.lastName}
          onChangeText={lastName =>
            setSignUpDetails(details => ({...details, lastName}))
          }
          placeholder="Last name*"
          placeholderTextColor={colors.greyDarker}
          style={styles.contactNumberInput}
          keyboardType="ascii-capable"
          inputMode="text"
          textContentType="name"
          autoComplete="name"
        />
        <TextInput
          value={signUpDetails.email}
          onChangeText={email =>
            setSignUpDetails(details => ({
              ...details,
              email,
            }))
          }
          placeholder="Email address*"
          placeholderTextColor={colors.greyDarker}
          style={styles.contactNumberInput}
          keyboardType="email-address"
          inputMode="email"
          textContentType="emailAddress"
          autoComplete="email"
        />
        <DatePicker
          value={signUpDetails.dob}
          onValueChange={dob =>
            setSignUpDetails(details => ({...details, dob}))
          }
          label="Date of birth*"
          styles={{
            container: {
              ...styles.contactNumberInput,
              paddingHorizontal: 0,
              paddingVertical: 0,
              height: 48,
            },
          }}
        />
        <TextInput
          value={signUpDetails.contactNumber}
          onChangeText={contactNumber =>
            setSignUpDetails(details => ({
              ...details,
              contactNumber: contactNumber.replace(/[^0-9]/g, ''),
            }))
          }
          placeholder="Mobile number*"
          placeholderTextColor={colors.greyDarker}
          style={styles.contactNumberInput}
          keyboardType="phone-pad"
          inputMode="numeric"
          textContentType="telephoneNumber"
          autoComplete="tel"
        />
        <View style={styles.checkBoxContainer}>
          <CheckBox
            disabled={false}
            onCheckColor={colors.secondary}
            onTintColor={colors.secondary}
            onValueChange={TnC =>
              setSignUpDetails(prevValue => ({...prevValue, TnC}))
            }
            value={signUpDetails.TnC}
            tintColors={{false: colors.black, true: colors.secondary}}
          />
          <Label text={'I accept the '} textStyle={styles.TnCText} />
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                'https://api-production.drivethroughu.com/api/v1/termsAndConditions',
              )
            }>
            <Label
              text={'Terms of Use & Privacy Policy'}
              textStyle={styles.TnCLink}
            />
          </TouchableOpacity>
        </View>
        {otpRequested ? (
          <>
            <TextInput
              value={otp}
              onChangeText={text => setOtp(text.replace(/[^0-9]/g, ''))}
              placeholder="Enter OTP"
              placeholderTextColor={colors.greyDarker}
              style={styles.contactNumberInput}
              keyboardType="phone-pad"
              inputMode="numeric"
              textContentType="telephoneNumber"
              autoComplete="tel"
            />
            <Button
              onPress={() =>
                validateOTP({
                  otp,
                  navigate: screen => {
                    navigation.navigate(screen);
                    route.params?.setInitialRouteName(screen);
                  },
                  setLoading,
                  contactNumber: signUpDetails.contactNumber,
                  _id,
                  token,
                })
              }
              style={styles.loginButton}
              text={'Sign up'}
              textStyle={styles.loginText}
            />
          </>
        ) : null}
        <Button
          disabled={timer !== secondsToWaitBeforeRequestingAgain}
          onPress={validateDetails}
          style={styles.loginButton}
          text={
            otpRequested
              ? timer === secondsToWaitBeforeRequestingAgain
                ? 'Resend OTP'
                : timer
              : 'Request OTP'
          }
          textStyle={styles.loginText}
        />
        <Button
          onPress={() => navigation.pop()}
          style={{...styles.loginButton, backgroundColor: colors.greyDarker}}
          text={'Already an user? Log In'}
          textStyle={{...styles.loginText, color: colors.white}}
        />
      </KeyboardAwareScrollView>
      <Loader visible={loading} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  checkBoxContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 32,
    marginBottom: 16,
    width: '100%',
  },
  contactNumberInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutralGrey,
    color: colors.black,
    fontSize: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: '100%',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    bottom: 0,
    height: '65%',
    paddingHorizontal: 16,
    position: 'absolute',
    width: '100%',
  },
  image: {
    backgroundColor: colors.yellow,
    height: '40%',
    position: 'absolute',
    top: 0,
    width: '100%',
  },
  loginButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 100,
    marginVertical: 8,
    width: '100%',
  },
  loginText: {
    color: colors.white,
    fontSize: 16,
  },
  title: {
    alignSelf: 'flex-start',
    color: colors.black,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
    textAlign: 'left',
  },
  TnCLink: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    textDecorationColor: colors.secondary,
  },
  TnCText: {
    color: colors.black,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignupScreen;
