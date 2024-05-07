import React from 'react';
import Label from '../Label';
import Modal from '../Modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import colors from '../../config/colors';
import {
  Keyboard,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Separator from '../Separator';

class DatePicker extends React.Component {
  state = {
    showDatePicker: false,
    setDate: new Date(),
  };

  onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      this.setState({showDatePicker: false});
    }

    if (selectedDate === undefined || selectedDate === null) {
      return;
    }
    this.props.onValueChange(selectedDate);
  };

  dynamicStyle = {
    labelStyle: {
      lineHeight: 18,
      fontSize: 12,
      color: this.props.error ? colors.primary : colors.greyDark,
    },
    textView: {
      paddingVertical: 8,
    },
  };

  isValueEmpty = () =>
    this.props.value === null ||
    this.props.value === undefined ||
    !(this.props.value instanceof Date);

  dateBaundarySet = () => {
    let dateProps = {};
    if (
      this.props.minDate !== null &&
      this.props.minDate !== undefined &&
      this.props.minDate instanceof Date
    ) {
      dateProps.minimumDate = this.props.minDate;
    }
    if (
      this.props.maxDate !== null &&
      this.props.maxDate !== undefined &&
      this.props.maxDate instanceof Date
    ) {
      dateProps.maximumDate = this.props.maxDate;
    }
    return dateProps;
  };

  getDateValueStyle = (styleFromParent, isDisabled) => {
    let styleObject = {
      ...style.value,
    };

    if (styleFromParent) {
      styleObject = {...styleObject, ...styleFromParent?.value};
    }

    if (isDisabled) {
      styleObject = {...styleObject, color: colors.neutralGrey};
    }
    return styleObject;
  };

  render() {
    let {
      disabled,
      error,
      label,
      locale = 'en-gb',
      styles,
      value,
      errorMsg,
      dobLabel,
      confirmButtonLabel,
      confirmButtonLabelStyle,
      dobLabelStyle,
      onConfirmButtonTap,
      privacy,
    } = this.props;

    return (
      <View style={{width: '100%'}}>
        <View
          style={[
            style.container,
            styles && styles.container,
            disabled && {backgroundColor: colors.greyLighter},
            error && {
              borderColor: colors.primary,
            },
          ]}>
          <TouchableOpacity
            onPress={() => {
              Keyboard.dismiss();
              !disabled && this.setState({showDatePicker: true});
            }}
            style={[
              style.textView,
              !this.isValueEmpty() && this.dynamicStyle.textView,
            ]}
            testID="picker_select"
            accessibilityLabel="dobPickerAccessibilityLabel">
            <View>
              <Text
                style={[
                  style.label,
                  !this.isValueEmpty() && this.dynamicStyle.labelStyle,
                  styles && styles.label,
                  disabled && {color: colors.neutralGrey},
                  this.isValueEmpty() ? style.labelMargin : {},
                ]}>
                {label}
              </Text>
              {!this.isValueEmpty() && (
                <Label
                  text={`${
                    value.getDate() > 9
                      ? value.getDate()
                      : '0' + value.getDate()
                  }/${
                    value.getMonth() + 1 > 9
                      ? value.getMonth() + 1
                      : '0' + (value.getMonth() + 1)
                  }/${value.getFullYear()}`}
                  textStyle={this.getDateValueStyle(styles, disabled)}
                  privacy={privacy}
                />
              )}
              {Platform.OS === 'ios'
                ? this.showDatePicker(
                    value,
                    locale,
                    confirmButtonLabel,
                    dobLabel,
                    confirmButtonLabelStyle,
                    dobLabelStyle,
                    onConfirmButtonTap,
                  )
                : this.state.showDatePicker && (
                    <DateTimePicker
                      testID="dateTimePicker"
                      value={this.isValueEmpty() ? new Date() : value}
                      mode={'date'}
                      display={this.props?.androidCalendarDisplay || 'default'}
                      is24Hour={true}
                      onChange={(event, date) => this.onDateChange(event, date)}
                      {...this.dateBaundarySet()}
                      locale={locale}
                    />
                  )}
            </View>
          </TouchableOpacity>
        </View>
        {error === true && errorMsg !== undefined && errorMsg.length > 0 && (
          <Label
            text={errorMsg}
            style={[
              {
                lineHeight: 18,
                fontSize: 12,
                color: colors.primary,
                marginTop: 4,
              },
              styles && styles.errorMsg,
            ]}
            testID="input-error"
          />
        )}
      </View>
    );
  }

  showDatePicker = (
    value,
    locale,
    confirmButtonLabel,
    dobLabel,
    confirmButtonLabelStyle,
    dobLabelStyle,
    onConfirmButtonTap,
  ) => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={this.state.showDatePicker}
        onModalClose={() => this.setState({showDatePicker: false})}>
        <SafeAreaView style={[style.modal]}>
          <View
            style={
              confirmButtonLabel ? style.updatedModalClose : style.modalClose
            }>
            <TouchableOpacity
              onPress={() => this.setState({showDatePicker: false})}>
              <View
                style={
                  confirmButtonLabel ? style.updatedCloseIcon : style.closeIcon
                }>
                <Label text="Close" />
              </View>
            </TouchableOpacity>
          </View>
          <Label
            text={dobLabel}
            textStyle={{
              fontSize: 16,
              lineHeight: 20,
              alignSelf: 'center',
              top: -20,
              ...dobLabelStyle,
            }}
          />
          <View style={style.confirmButton}>
            <TouchableOpacity
              onPress={() => {
                onConfirmButtonTap;
                this.setState({showDatePicker: false});
              }}>
              <Label
                text={confirmButtonLabel}
                textStyle={{
                  fontSize: 16,
                  lineHeight: 20,
                  color: colors.tertiaryBlue,
                  ...confirmButtonLabelStyle,
                }}
              />
            </TouchableOpacity>
          </View>
          {confirmButtonLabel && <Separator style={{top: -24}} />}
          <View style={style.picker}>
            <DateTimePicker
              testID="dateTimePicker"
              value={this.isValueEmpty() ? new Date() : value}
              mode={'date'}
              display={'spinner'}
              is24Hour={true}
              onChange={(event, date) => this.onDateChange(event, date)}
              {...this.dateBaundarySet()}
              locale={locale}
            />
          </View>
        </SafeAreaView>
      </Modal>
    );
  };
}

export default DatePicker;

const style = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 4,
    borderColor: colors.greyLight,
    borderStyle: 'solid',
  },
  textView: {
    flexDirection: 'row',
    paddingEnd: 20,
    paddingStart: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    color: colors.greyDark,
    lineHeight: 24,
  },
  value: {
    color: colors.black,
    fontSize: 16,
    lineHeight: 20,
  },
  modal: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    borderTopEndRadius: 16,
    borderTopStartRadius: 16,
    backgroundColor: colors.white,
  },

  modalClose: {
    width: '100%',
    flexDirection: 'row-reverse',
  },
  closeIcon: {
    marginTop: 16,
    marginEnd: 16,
  },

  updatedModalClose: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  updatedCloseIcon: {
    marginTop: 16,
    marginEnd: 16,
    marginStart: 16,
  },
  labelMargin: {
    paddingVertical: 14,
  },
  picker: {
    width: '100%',
    height: '100%',
  },
  confirmButton: {
    top: -40,
    marginEnd: 16,
    alignSelf: 'flex-end',
  },
});
