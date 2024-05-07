import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import Label from '../../../components/Label';
import colors from '../../../config/colors';

export const renderItem = ({item, index}) => {
  if (item.loader) {
    return (
      <ActivityIndicator
        color={colors.secondary}
        size={'large'}
        style={styles.loadingIndicator}
      />
    );
  }
  return (
    <View key={index.toString()} style={styles.item}>
      <View>
        <Label
          text={`Date: ${new Date(Number(item.Date + '000')).toDateString()}`}
        />
        <Label
          text={`Time: ${new Date(
            Number(item.Date + '000'),
          ).toLocaleTimeString()}`}
        />
        <Text>
          <Label text={`Status: `} textStyle={styles.itemInfo} />
          <Label
            text={item.Status}
            textStyle={{...styles.itemInfo, color: colors.secondary}}
          />
        </Text>
        {item.tripId ? (
          <Label text={`Trip Id: ${item.tripId}`} textStyle={styles.itemInfo} />
        ) : null}
      </View>
      <Label text={item.Amount} textStyle={styles.itemPayment} />
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    borderColor: colors.neutralGrey,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
    padding: 16,
    width: '100%',
  },
  itemInfo: {
    color: colors.black,
    fontSize: 16,
  },
  itemPayment: {
    color: colors.black,
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingIndicator: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.white,
    justifyContent: 'center',
    width: '100%',
  },
});
