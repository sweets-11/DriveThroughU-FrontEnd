import React from 'react';
import {ActivityIndicator, Modal, StyleSheet, Text, View} from 'react-native';
import Label from '../Label';
import colors from '../../config/colors';

const Loader = ({text = 'Please Wait', visible, from = 'unknown'}) => {
  console.log('visible: ', visible, ' from: ', from);
  return (
    <Modal
      animationType="slide"
      style={styles.loaderModal}
      transparent={true}
      visible={visible}>
      <View style={styles.modalLoaderContainer}>
        <ActivityIndicator size={60} color="#FFF" />
        <Label text={text} textStyle={styles.modalLoaderText} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  loaderModal: {
    flex: 1,
  },
  modalLoaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalLoaderText: {
    fontSize: 18,
    color: colors.white,
  },
});

export default Loader;
