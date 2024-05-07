import React, {useCallback, useContext, useEffect, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import colors from '../../config/colors';
import Label from '../../components/Label';
import {ReactReduxContext} from 'react-redux';
import {
  getPastTrips,
  getPastTripsLoading,
} from '../../store/selectors/DeliveryModeSelectors';
import {fetchPastTrips} from '../../store/reducers/DeliveryModeReducer';
import {useFocusEffect} from '@react-navigation/native';

const PastTripsScreen = ({navigation}) => {
  const {store} = useContext(ReactReduxContext);
  const [pastTripsLoading, setPastTripsLoading] = useState(
    getPastTripsLoading(store.getState()),
  );
  const [pastTrips, setPastTrips] = useState(getPastTrips(store.getState()));

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      setPastTripsLoading(getPastTripsLoading(state));
      setPastTrips(getPastTrips(state));
    });

    return () => {
      unsubscribe();
    };
  }, [store]);

  useFocusEffect(
    useCallback(() => {
      store.dispatch(fetchPastTrips());
      return () => {};
    }, [store]),
  );

  const onRefresh = useCallback(() => {
    if (!pastTripsLoading) {
      store.dispatch(fetchPastTrips());
    }
  }, [pastTripsLoading, store]);

  const OrderInfo = ({info, title}) => {
    return (
      <View
        style={{
          flexDirection: 'row',
          marginVertical: 8,
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
        }}>
        <Label text={title} textStyle={styles.orderInfoTitle} />
        <Label text={info} textStyle={styles.orderInfo} />
      </View>
    );
  };

  const renderItem = ({item, index}) => {
    return (
      <View key={index.toString()} style={styles.orderInfoContainer}>
        <View
          style={{
            flex: 0.7,
            width: '70%',
            alignItems: 'flex-start',
            justifyContent: 'center',
          }}>
          <OrderInfo
            info={new Date(item.createdAt).toDateString()}
            title={'Delivery date: '}
          />
          <OrderInfo
            info={new Date(item.createdAt).toLocaleTimeString()}
            title={'Delivery time: '}
          />
          <OrderInfo
            info={item.pickupToDropoff.distance}
            title={'Delivery distance: '}
          />
          <OrderInfo
            info={item.pickupToDropoff.time}
            title={'Delivery time: '}
          />
        </View>
        <View
          style={{flex: 0.3, alignItems: 'flex-end', justifyContent: 'center'}}>
          <Label
            text={
              item.paidToDriver
                ? 'Paid to your strip account'
                : 'Will transfer money soon'
            }
            style={{
              ...styles.tripStatus,
              color: item.paidToDriver
                ? colors.secondary
                : colors.tertiaryYellow,
            }}
          />
        </View>
      </View>
    );
  };
  return (
    <View style={styles.container}>
      {!pastTrips?.length ? (
        <View style={styles.noTrips} pointerEvents="box-none">
          <Label
            text={"You have completed no trips!\nLet's delivery some orders."}
            textStyle={styles.noTripsText}
          />
        </View>
      ) : null}
      <FlatList
        data={pastTrips}
        renderItem={renderItem}
        style={styles.flatlist}
        refreshing={pastTripsLoading}
        onRefresh={onRefresh}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.white,
    flex: 1,
    justifyContent: 'center',
  },
  flatlist: {
    backgroundColor: colors.white,
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    width: '100%',
  },
  noTrips: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    zIndex: 1,
  },
  noTripsText: {
    color: colors.greyDark,
    fontSize: 18,
    textAlign: 'center',
  },
  orderInfo: {
    color: colors.black,
    flexShrink: 1,
    fontSize: 16,
  },
  orderInfoContainer: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
    padding: 16,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 3,
    width: '100%',
  },
  orderInfoTitle: {
    color: colors.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
  tripStatus: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PastTripsScreen;
