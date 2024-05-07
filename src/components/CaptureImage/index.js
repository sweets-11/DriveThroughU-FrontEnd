import React from 'react';
import {StyleSheet, TouchableOpacity} from 'react-native';
import {clickPhoto} from './utils';
import colors from '../../config/colors';
import Label from '../Label';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const CaptureImage = ({cropStyle, setPhotoUrl, style = {}, text}) => {
  return (
    <TouchableOpacity
      onPress={() =>
        clickPhoto(cropStyle.cropHeight, cropStyle.cropWidth, setPhotoUrl)
      }
      style={{...styles.container, ...style}}>
      <MaterialCommunityIcons
        name="camera"
        color={colors.secondary}
        size={22}
      />
      <Label text={text} textStyle={styles.text} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.neutralGrey,
    borderRadius: 100,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: {
    color: colors.secondary,
    fontSize: 16,
    marginLeft: 8,
  },
});

export default CaptureImage;
