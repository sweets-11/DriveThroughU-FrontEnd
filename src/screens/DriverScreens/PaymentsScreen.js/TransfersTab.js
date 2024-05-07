import React, {useCallback, useContext, useEffect, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import Label from '../../../components/Label';
import colors from '../../../config/colors';
import {ReactReduxContext} from 'react-redux';
import {getTransfers} from '../../../store/selectors/DriverPaymentSelector';
import {fetchTransfers} from '../../../store/reducers/DriverPaymentReducer';
import {renderItem} from './utils';
import Loader from '../../../components/Loader/Loader';
import {useFocusEffect} from '@react-navigation/native';

const TransfersTab = ({navigation}) => {
  const {store} = useContext(ReactReduxContext);

  const [data, setData] = useState(getTransfers(store.getState()));
  const [firstLoad, setFirstLoad] = useState(true);
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      setData(getTransfers(state));
    });
    return () => {
      unsubscribe();
    };
  }, [store]);

  const onEndReached = useCallback(() => {
    if (!data.error && !data.loading && data.nextPage) {
      store.dispatch(fetchTransfers({pageNumber: data.nextPage}));
    }
  }, [data, store]);

  const onRefresh = useCallback(() => {
    store.dispatch(fetchTransfers({pageNumber: 1, refresh: true}));
  }, [store]);

  useFocusEffect(
    useCallback(() => {
      if (!data?.data?.length && !data.error && !data.loading && firstLoad) {
        store.dispatch(fetchTransfers({pageNumber: 1}));
        setFirstLoad(false);
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
              'Our money transfers to your strip account, will show here.\nCurrently you have no transfers!'
            }
            textStyle={styles.noPayouts}
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
  noPayouts: {
    color: colors.greyDark,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default TransfersTab;
