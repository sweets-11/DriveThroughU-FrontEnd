import {Alert} from 'react-native';

export const validateAddress = ({
  address,
  failureCallback,
  successCallback,
}) => {
  const keys = Object.keys(address);
  if (!keys.length) {
    failureCallback
      ? failureCallback()
      : Alert.alert('Please fill all the required details');
    return;
  }
  let validDetails = 0;
  keys.some(key => {
    const value = address[key];
    switch (key) {
      case 'house':
        if (value.trim()) {
          validDetails++;
        } else {
          failureCallback
            ? failureCallback()
            : Alert.alert('Please enter a valid Address Line 1');
          return true;
        }
        break;
      case 'title':
        if (value.trim()) {
          validDetails++;
        } else {
          failureCallback
            ? failureCallback()
            : Alert.alert('Please enter a valid name for your address');
          return true;
        }
        break;
      case 'floor':
      case 'apartment':
      case 'instructions':
        break;
      default:
        failureCallback
          ? failureCallback()
          : Alert.alert('Something is not right!');
        return true;
    }
  });

  if (validDetails === 2) {
    successCallback();
  }
};
