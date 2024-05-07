import {launchCamera} from 'react-native-image-picker';
import ImagePicker from 'react-native-image-crop-picker';
import {getToken} from '../../utils/storage';
import {AUTH_TOKEN} from '../../utils/otpFunctions';
import {AWS_BASE_URL} from '@env';
import axios from 'axios';
import {Alert} from 'react-native';

export const clickPhoto = (cropHeight = 250, cropWidth = 322, setImageUrl) => {
  let options = {
    storageOptions: {
      skipBackup: true,
      path: 'images',
    },
  };

  launchCamera(options, response => {
    console.log('Response = ', response);
    if (response.didCancel) {
      console.log('User cancelled image picker');
    } else {
      ImagePicker.openCropper({
        path: response.assets[0].uri,
        height: cropHeight,
        width: cropWidth,
      })
        .then(image => {
          console.log(image);
          setImageUrl(image.path);
        })
        .catch(error => {
          Alert.alert('Error in capturing image', error.message);
          setImageUrl(null);
        });
    }
  });
};

export const callOnboardingApi = ({
  driver,
  drivingLicense,
  numberPlate,
  vehicle,
}) => {
  return new Promise((resolve, reject) => {
    getToken(AUTH_TOKEN)
      .then(token => {
        var files = new FormData();
        files.append('files', {
          uri: driver,
          name: 'driver.jpg',
          type: 'image/jpeg',
        });
        files.append('files', {
          uri: drivingLicense,
          name: 'drivingLicense.jpg',
          type: 'image/jpeg',
        });
        files.append('files', {
          uri: numberPlate,
          name: 'numberPlate.jpg',
          type: 'image/jpeg',
        });
        files.append('files', {
          uri: vehicle,
          name: 'vehicle.jpg',
          type: 'image/jpeg',
        });
        var config = {
          method: 'post',
          url: `${AWS_BASE_URL}/imageUpload`,
          headers: {
            authorization: `Bearer ${token}`,
          },
          data: files,
        };
        axios(config)
          .then(response => {
            console.log('Reponse from upload: ', response.data);
            axios
              .post(
                `${AWS_BASE_URL}/order/connectAcc`,
                {},
                {
                  headers: {
                    authorization: `Bearer ${token}`,
                  },
                },
              )
              .then(response => {
                console.log('response: ', response);
                resolve(response.data.accountLink?.url);
              })
              .catch(error => {
                reject(error.message);
              });
          })
          .catch(error => {
            console.log('Error in uploading: ', error);
            reject(error.message);
          });
      })
      .catch(error => {
        console.log('Error in fetching token: ', error);
        reject(error.message);
      });
  });
};
