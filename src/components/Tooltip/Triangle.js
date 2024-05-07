import React from 'react';
import {View, StyleSheet} from 'react-native';
import colors from '../../config/colors';

const Triangle = ({style, isDown}) => (
  <View style={[styles.triangle, style, isDown ? styles.down : {}]} />
);

const styles = StyleSheet.create({
  down: {
    borderTopColor: colors.white,
    borderTopWidth: 8,
    shadowOffset: {height: 6, width: 0},
    borderBottomColor: null,
    borderBottomWidth: null,
    elevation: 8,
  },
  triangle: {
    borderBottomColor: colors.white,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderLeftWidth: 8,
    borderRightColor: 'transparent',
    borderRightWidth: 8,
    elevation: 8,
    height: 0,
    shadowColor: 'rgba(0,0,0,0.16)',
    shadowOffset: {height: -6, width: 0},
    shadowOpacity: 1,
    shadowRadius: 4,
    width: 0,
    zIndex: 1,
  },
});

export default Triangle;
