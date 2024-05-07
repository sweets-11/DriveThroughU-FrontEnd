import React from 'react';
import {Text} from 'react-native';

function Label({text, textStyle = {}, ...rest}) {
  return (
    <Text style={textStyle} {...rest}>
      {text}
    </Text>
  );
}

export default Label;
