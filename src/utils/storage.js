import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {AUTH_KEY: 'LoggedIn', NOTIFICATION_KEY: 'Notifications'};
const storeToken = async ({key, value}) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.log('Error storing auth token: ', error);
  }
};

const getToken = async key => {
  try {
    const value = await AsyncStorage.getItem(key);
    return JSON.parse(value);
  } catch (error) {
    console.log('Error getting auth token: ', error);
  }
};

const removeToken = async key => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.log('Error removing auth token: ', error);
  }
};

export {getToken, KEYS, removeToken, storeToken};
