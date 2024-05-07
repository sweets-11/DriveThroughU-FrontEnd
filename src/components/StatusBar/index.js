import React from 'react';
import {View} from 'react-native';
import colors from '../../config/colors';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const StatusBarIOS = () => {
  const insets = useSafeAreaInsets();
  const statusBarHeight = insets.top;
  return (
    <View
      style={{
        width: '100%',
        height: statusBarHeight,
        backgroundColor: colors.tertiary,
      }}
    />
  );
};

export default StatusBarIOS;
