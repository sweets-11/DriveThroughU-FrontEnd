import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import NumberPlease from './RNNumberPicker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Modal from '../Modal';
import Label from '../Label';
import colors from '../../config/colors';
import Button from '../Button';

const NumberPicker = ({onModalClose = () => {}, setValue, visible, value}) => {
  const [hours, setHours] = useState(value);
  const numberOfHours = [{id: '0', label: 'Hours', min: 0, max: 10}];
  return (
    <Modal onModalClose={onModalClose} visible={visible}>
      <View style={styles.container}>
        <MaterialCommunityIcons
          name="clock-time-three"
          color={colors.secondary}
          size={58}
        />
        <Label
          text={'Select number of hours to ride'}
          textStyle={styles.title}
        />
        <NumberPlease
          pickers={numberOfHours}
          values={hours}
          onChange={values => setHours(values)}
        />
        <View style={styles.dash} />
        <View style={styles.buttonsContainer}>
          <Button
            onPress={onModalClose}
            style={{
              ...styles.confirmButton,
              backgroundColor: colors.white,
              marginRight: 4,
            }}
            text={'Cancel'}
            textStyle={{...styles.confirmButtonText, color: colors.black}}
          />
          <Button
            onPress={() => {
              setValue(hours);
              onModalClose();
            }}
            style={styles.confirmButton}
            text={'Done'}
            textStyle={styles.confirmButtonText}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  buttonsContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    width: '100%',
  },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 100,
    flex: 1,
    marginLeft: 4,
    padding: 16,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 16,
  },
  container: {
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: 16,
    bottom: 0,
    padding: 16,
    position: 'absolute',
    width: '100%',
  },
  dash: {
    backgroundColor: colors.greyLight,
    height: 2,
    marginTop: 16,
    width: '100%',
  },
  title: {
    color: colors.black,
    fontSize: 22,
    marginBottom: 28,
    marginTop: 16,
  },
});

export default NumberPicker;
