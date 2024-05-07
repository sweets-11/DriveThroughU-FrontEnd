import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Modal from '../Modal';
import colors from '../../config/colors';
import Label from '../Label';
import CheckBox from '@react-native-community/checkbox';
import Button from '../Button';

export const carRentItems = [
  {id: 0, name: 'Small car', value: 10},
  {id: 1, name: 'Standard car', value: 20},
  {id: 2, name: 'Large car', value: 30},
];

const ParcelContent = ({
  carRent = false,
  onModalClose = () => {},
  onSelectItem = () => {},
  preSelectedItems,
  visible,
}) => {
  const [selectedItems, setSelectedItems] = useState(
    preSelectedItems.filter(item => item),
  );
  return (
    <Modal onModalClose={onModalClose} visible={visible}>
      <View style={styles.container}>
        <MaterialCommunityIcons
          name={carRent ? 'car-multiple' : 'clipboard-file-outline'}
          color={colors.secondary}
          size={58}
        />
        <Label
          text={
            carRent ? 'Select class of car you want' : 'Select mail content'
          }
          textStyle={styles.title}
        />
        {(carRent
          ? carRentItems
          : [
              {id: 0, name: 'Documents|Books', value: 'docBook'},
              {id: 1, name: 'Clothes|Accessories', value: 'clothesAccessories'},
              {id: 2, name: 'Food|Flowers', value: 'foodFlowers'},
              {id: 3, name: 'Household Items', value: 'household'},
              {id: 4, name: 'Sports & Other Equipment', value: 'sports'},
              {id: 5, name: 'Electronic Items', value: 'electronic'},
            ]
        ).map((item, index) => {
          return (
            <View key={index.toString()} style={styles.itemCheckBoxContainer}>
              <CheckBox
                disabled={false}
                onCheckColor={colors.secondary}
                onTintColor={colors.secondary}
                onValueChange={checked => {
                  setSelectedItems(prevValue => {
                    if (checked) {
                      return carRent ? [item] : [...prevValue, item];
                    } else {
                      return [
                        ...prevValue.filter(element => element.id !== item.id),
                      ];
                    }
                  });
                }}
                value={
                  selectedItems.findIndex(element => element.id === item.id) >=
                  0
                }
                tintColors={{
                  false: colors.neutralGrey,
                  true: colors.secondary,
                }}
              />
              <Label text={item.name} textStyle={styles.itemCheckBoxLabel} />
            </View>
          );
        })}
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
              onSelectItem(selectedItems);
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
  itemCheckBoxContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    marginVertical: 12,
  },
  itemCheckBoxLabel: {
    color: colors.black,
    fontSize: 14,
    marginLeft: 16,
  },
  title: {
    color: colors.black,
    fontSize: 22,
    marginBottom: 28,
    marginTop: 16,
  },
});

export default ParcelContent;
