import React, {useCallback, useContext, useEffect, useState} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import Label from '../../../components/Label';
import colors from '../../../config/colors';
import {ReactReduxContext} from 'react-redux';
import {getDailyPayouts} from '../../../store/selectors/DriverPaymentSelector';
import {fetchDailyPayouts} from '../../../store/reducers/DriverPaymentReducer';
import {renderItem} from './utils';
import Loader from '../../../components/Loader/Loader';
import {useFocusEffect} from '@react-navigation/native';

const DailyPayOutsTab = ({navigation}) => {
  const {store} = useContext(ReactReduxContext);

  const [data, setData] = useState(getDailyPayouts(store.getState()));
  const [firstLoad, setFirstLoad] = useState(true);
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      setData(getDailyPayouts(state));
    });
    return () => {
      unsubscribe();
    };
  }, [store]);

  const onEndReached = useCallback(() => {
    if (!data.error && !data.loading && data.nextPage) {
      store.dispatch(fetchDailyPayouts({pageNumber: data.nextPage}));
    }
  }, [data, store]);

  useFocusEffect(
    useCallback(() => {
      if (!data?.data?.length && !data.error && !data.loading && firstLoad) {
        store.dispatch(fetchDailyPayouts({pageNumber: 1}));
      }
      return () => {
        setFirstLoad(false);
      };
    }, [data, firstLoad, store]),
  );

  useEffect(() => {
    if (data?.data?.length && !data.error && data.loading) {
      const indexOfLoader = data.data.findIndex(item => item.loader);
      if (indexOfLoader === -1) {
        setData(prevValue => {
          return {...prevValue, data: [...prevValue.data, {loader: true}]};
        });
      }
    }
  }, [data, store]);

  const onRefresh = useCallback(() => {
    store.dispatch(fetchDailyPayouts({pageNumber: 1, refresh: true}));
  }, [store]);

  return (
    <>
      <View style={styles.container}>
        {data?.data?.length ? (
          <>
            <FlatList
              data={data?.data}
              renderItem={renderItem}
              style={styles.flatlist}
              onEndReached={onEndReached}
              onEndReachedThreshold={0}
              onRefresh={onRefresh}
              refreshing={data.loading}
            />
            {!data.loading ? (
              <View style={styles.footer}>
                <Label
                  text={`Total entries: ${data.data?.length}`}
                  textStyle={styles.footerText}
                />
                <Label
                  text={`Total amount: $${data.data
                    ?.reduce(
                      (total, value) => Number(total) + Number(value.Amount),
                      0,
                    )
                    .toFixed(2)}`}
                  textStyle={styles.footerText}
                />
              </View>
            ) : null}
          </>
        ) : (
          <Label
            text={
              'Pay-outs from stripe to your account, will show here.\nCurrently you have no pay-outs from stripe!'
            }
            textStyle={styles.noPayments}
          />
        )}
      </View>
      <Loader visible={data.loading && !data?.data?.length} />
    </>
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
  footer: {
    alignItems: 'center',
    borderTopColor: colors.tertiary,
    borderTopWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    width: '100%',
  },
  footerText: {
    color: colors.black,
    fontSize: 18,
  },
  noPayments: {
    color: colors.greyDark,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default DailyPayOutsTab;
