import React from 'react';
import Dash from 'react-native-dash';
import {View} from 'react-native';

import colors from '../../config/colors';

function Separator({
  dashColor = colors.greyLight,
  dashGap = 0,
  dashLength,
  dashThickness = 1,
  dashStyle,
  style = {width: '100%'},
  testID,
}) {
  return (
    <>
      <View testID={testID} />
      <Dash
        dashColor={dashColor}
        dashGap={dashGap}
        dashLength={dashLength}
        dashStyle={dashStyle}
        dashThickness={dashThickness}
        style={style} //flexDirection column for vertical
      />
    </>
  );
}

export default Separator;
