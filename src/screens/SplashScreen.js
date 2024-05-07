import React from 'react';
import {StyleSheet, View} from 'react-native';
import colors from '../config/colors';
import Label from '../components/Label';

const SplashScreen = props => {
  return (
    <View style={styles.container}>
      <Label text={'DriveThroughU'} textStyle={styles.text} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.white,
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    color: colors.black,
    fontSize: 36,
    fontWeight: 'bold',
  },
});

export default SplashScreen;
