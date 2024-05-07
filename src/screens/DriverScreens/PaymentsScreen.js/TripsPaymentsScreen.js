import React, {useState} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../../../config/colors';
import Label from '../../../components/Label';
import TransfersTab from './TransfersTab';
import DailyPayOutsTab from './DailyPayOutsTab';

const HeaderTab = ({active = false, iconName, label, onPress}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.headerTabContainer}>
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          padding: 16,
          width: '100%',
        }}>
        <Label
          text={label}
          textStyle={{
            ...styles.headerTabText,
            color: active ? colors.tertiary : colors.neutralGrey,
          }}
        />
        <MaterialCommunityIcons
          name={iconName}
          size={32}
          color={active ? colors.tertiary : colors.neutralGrey}
        />
      </View>
      <View
        style={{
          ...styles.underline,
          borderColor: active ? colors.tertiary : colors.white,
        }}
      />
    </TouchableOpacity>
  );
};

const TripsPaymentsScreen = props => {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <HeaderTab
          active={activeTab === 0}
          iconName={'cash-fast'}
          label={'Transfers'}
          onPress={() => setActiveTab(0)}
        />
        <HeaderTab
          active={activeTab !== 0}
          iconName={'cash-check'}
          label={'Daily pay-outs'}
          onPress={() => setActiveTab(1)}
        />
      </View>
      {activeTab === 0 ? <TransfersTab /> : <DailyPayOutsTab />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  headerTabContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerTabText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  underline: {
    borderWidth: 1,
    width: '100%',
  },
});

export default TripsPaymentsScreen;
