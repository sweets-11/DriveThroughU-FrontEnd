import React, {useRef, useState} from 'react';
import {
  Image,
  Keyboard,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import colors from '../config/colors';
import Button from '../components/Button';
import {ScreenNames} from '../navigation/ScreenNames';
import {secondsToWaitBeforeRequestingAgain} from '../utils/timer';
import {handleOTPRequest, validateOTP} from '../utils/otpFunctions';
import Loader from '../components/Loader/Loader';
import Label from '../components/Label';

const LoginScreen = ({navigation, route}) => {
  const [contactNumber, setContactNumber] = useState(null);
  const [otp, setOtp] = useState(null);
  const [otpRequested, setOtpRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [_id, set_id] = useState('');
  const [token, setToken] = useState('');
  const [timer, setTimer] = useState(secondsToWaitBeforeRequestingAgain);
  const timerRef = useRef(timer);

  return (
    <TouchableWithoutFeedback
      accessible={false}
      onPress={Keyboard.dismiss}
      style={{flex: 1, backgroundColor: colors.secondary}}>
      <View style={{flex: 1, backgroundColor: colors.secondary}}>
        <Image
          source={require('../assets/images/loginSignup.png')}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.container}>
          <Label
            text="Welcome back to DriveThroughU"
            textStyle={styles.title}
          />
          <TextInput
            value={contactNumber}
            onChangeText={text => setContactNumber(text.replace(/[^0-9]/g, ''))}
            placeholder="Enter your mobile number"
            placeholderTextColor={colors.greyDarker}
            style={styles.contactNumberInput}
            keyboardType="phone-pad"
            inputMode="numeric"
            textContentType="telephoneNumber"
            autoComplete="tel"
          />
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
                    contactNumber,
                    otp,
                    navigate: screen => {
                      navigation.navigate(screen);
                      route.params?.setInitialRouteName(screen);
                    },
                    setLoading,
                    _id,
                    token,
                  })
                }
                style={styles.loginButton}
                text={'Log In'}
                textStyle={styles.loginText}
              />
            </>
          ) : null}
          <Button
            disabled={timer !== secondsToWaitBeforeRequestingAgain}
            onPress={() =>
              handleOTPRequest({
                contactNumber,
                setOtpRequested,
                setLoading,
                timerRef,
                setTimer,
                set_id,
                setToken,
              })
            }
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
            onPress={() => navigation.navigate(ScreenNames.SIGNUP_SCREEN)}
            style={{...styles.loginButton, backgroundColor: colors.greyDarker}}
            text={'Not an user? Sign up'}
            textStyle={{...styles.loginText, color: colors.white}}
          />
        </View>
        <Loader visible={loading} from="Login" />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
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
    height: '55%',
    padding: 16,
    position: 'absolute',
    width: '100%',
  },
  image: {
    backgroundColor: colors.secondary,
    height: '50%',
    position: 'absolute',
    top: 0,
    width: '100%',
  },
  loginButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
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
});

export default LoginScreen;
