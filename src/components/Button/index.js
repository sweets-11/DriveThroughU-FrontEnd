import React from 'react';
import {TouchableOpacity, View} from 'react-native';
import Label from '../Label';

function Button({
  disabled = false,
  numberOfLines = 0,
  onPress,
  style = {},
  text,
  textStyle = {},
  ...rest
}) {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={!disabled && onPress}
      style={style}
      {...rest}>
      {text ? (
        <Label
          numberOfLines={numberOfLines}
          textStyle={textStyle}
          text={text}
        />
      ) : null}
    </TouchableOpacity>
  );
}

export default Button;
