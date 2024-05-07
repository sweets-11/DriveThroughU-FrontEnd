import {Alert} from 'react-native';
import axios from 'axios';
import {AWS_BASE_URL} from '@env';
import {runTimer} from './timer';
import {ScreenNames} from '../navigation/ScreenNames';
import {storeToken} from '../utils/storage';
import {registerFCM} from '../notifications/registerFCM';

export const AUTH_TOKEN = 'token';

const handleOTPRequest = ({
  contactNumber,
  navigation,
  setOtpRequested,
  setLoading = () => {},
  timerRef,
  setTimer,
  signUpDetails = null,
  set_id,
  setToken,
}) => {
  if (!contactNumber || contactNumber.length !== 10) {
    Alert.alert('Please enter a valid mobile number');
    return;
  }
  setLoading(true);
  if (signUpDetails) {
    axios
      .post(`${AWS_BASE_URL}/generateOtp`, {
        firstName: signUpDetails.firstName,
        lastName: signUpDetails.lastName,
        email: signUpDetails.email,
        mobileNumber: signUpDetails.contactNumber,
        dob: signUpDetails.dob,
      })
      .then(response => {
        set_id(response.data.user?._id);
        console.log('reponse: ', response);
        setToken(response.data.token);
        setLoading(false);
        setOtpRequested(true);
        runTimer({timerRef, setTimer});
      })
      .catch(error => {
        console.log('Error in generating OTP: ', error.response.data.message);
        if (error.response.data.login) {
          Alert.alert('Login', 'You are already registered, please login', [
            {
              text: 'Login',
              onPress: () => {
                navigation.goBack();
              },
              isPreferred: true,
              style: 'default',
            },
          ]);
          setLoading(false);
          return;
        }
        setLoading(false);
      });
  } else {
    axios
      .post(
        `${AWS_BASE_URL}/login`,
        {
          mobileNumber: contactNumber,
        },
        {withCredentials: true},
      )
      .then(response => {
        console.log('reponse: ', response);
        set_id(response.data.user?._id);
        setToken(response.data.token);
        setLoading(false);
        setOtpRequested(true);
      })
      .catch(error => {
        Alert.alert(`Error generating OTP`, error.response.data.message);
        console.log('Error in generating OTP: ', error.response);
        setLoading(false);
      });
  }
};

const validateOTP = ({
  contactNumber,
  otp = '',
  navigate,
  setLoading = () => {},
  _id,
  token,
}) => {
  if (!otp || otp.length !== 6) {
    Alert.alert('Please enter the correct OTP of 6 digits');
    return;
  }
  setLoading(true);
  axios
    .post(
      `${AWS_BASE_URL}/verifyUser`,
      {
        mobileNumber: contactNumber,
        otp,
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    )
    .then(response => {
      console.log('reponse: ', response);
      storeToken({key: AUTH_TOKEN, value: token})
        .then(() => {
          setLoading(false);
          registerFCM();
          navigate(ScreenNames.HOME_SCREEN);
        })
        .catch(error => {
          setLoading(false);
          Alert.alert('Error in storing token: ', error);
        });
    })
    .catch(error => {
      console.log('Error in validating OTP: ', error.response.data.message);
      setLoading(false);
      Alert.alert(`Error in verifying OTP: ${error.response.data.message}`);
    });
};

export {handleOTPRequest, validateOTP};
