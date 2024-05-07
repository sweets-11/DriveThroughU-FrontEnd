import React, {useCallback, useContext, useEffect, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {ReactReduxContext} from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getPastOrders,
  getPastOrdersLoading,
} from '../store/selectors/UserSelectors';
import {fetchPastOrders} from '../store/reducers/UserReducer';
import colors from '../config/colors';
import Label from '../components/Label';
import {DRIVER_STATUS} from '../store/reducers/DeliveryModeReducer';
import Modal from '../components/Modal';
import Button from '../components/Button';
import {
  updateDeliveryStatus,
  updateTrip,
} from '../store/reducers/DriverReducer';
import {ScreenNames} from '../navigation/ScreenNames';
import Tooltip from '../components/Tooltip';

const MyOrdersScreen = ({navigation}) => {
  const {store} = useContext(ReactReduxContext);
  const [pastOrdersLoading, setPastOrdersLoading] = useState(
    getPastOrdersLoading(store.getState()),
  );
  const [pastOrders, setPastOrders] = useState(getPastOrders(store.getState()));
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderDetail, setOrderDetail] = useState(null);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      setPastOrdersLoading(getPastOrdersLoading(state));
      setPastOrders(getPastOrders(state));
    });

    return () => {
      unsubscribe();
    };
  }, [store]);

  useFocusEffect(
    useCallback(() => {
      store.dispatch(fetchPastOrders());
      return () => {};
    }, [store]),
  );

  const onRefresh = useCallback(() => {
    if (!pastOrdersLoading) {
      store.dispatch(fetchPastOrders());
    }
  }, [pastOrdersLoading, store]);

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
    const deliveryLocation = item.dropoff_Location;
    const pickupLocation = item.pickup_Location;
    const tripStatus = item.tripStatus;
    const tripCompleted =
      tripStatus?.toLowerCase() === DRIVER_STATUS.DELIVERED.toLowerCase() ||
      tripStatus?.toLowerCase() === DRIVER_STATUS.RIDE_COMPLETED.toLowerCase();
    return (
      <TouchableOpacity
        disabled={tripCompleted}
        key={index.toString()}
        onPress={() => {
          store.dispatch(updateTrip({trip: item}));
          if (!item.driverId) {
            store.dispatch(
              updateDeliveryStatus({
                deliveryStatus: DRIVER_STATUS.FINDING_DRIVERS,
              }),
            );
          } else {
            store.dispatch(
              updateDeliveryStatus({
                deliveryStatus: item.tripStatus,
              }),
            );
          }

          navigation.navigate(
            item.tripType?.toLowerCase()?.includes('rent')
              ? ScreenNames.CAR_RENT_PICKUP_SCREEN
              : ScreenNames.DELIVERY_SCREEN,
            {
              isParcelDelivery: !item.tripType
                ?.toLowerCase()
                ?.includes('grocery'),
            },
          );
        }}
        style={styles.orderInfoContainer}>
        <View
          style={{
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            width: '70%',
          }}>
          <OrderInfo
            info={new Date(item.createdAt).toDateString()}
            title={'Order date: '}
          />
          {item.tripType?.toLowerCase()?.includes('car') ? null : (
            <OrderInfo
              info={deliveryLocation.address_name}
              title={'Delivery Address: '}
            />
          )}
          <OrderInfo
            info={pickupLocation.address_name}
            title={'Pickup Address: '}
          />
        </View>
        <View
          style={{
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            width: '30%',
          }}>
          <View style={styles.orderMenu}>
            <Tooltip
              actionType={'press'}
              containerStyle={styles.tooltip}
              popover={close => {
                return (
                  <View style={{width: '100%'}}>
                    {tripCompleted ? (
                      <>
                        <Button
                          onPress={() => {
                            close();
                            setOrderDetail(item);
                            setTimeout(() => setShowOrderModal(true));
                          }}
                          style={styles.toolTipOptions}
                          text={'Details'}
                          textStyle={styles.toolTipOptionsText}
                        />
                        <View
                          style={{
                            backgroundColor: colors.secondary,
                            height: 8,
                            width: '100%',
                          }}
                        />
                      </>
                    ) : null}
                    <Button
                      onPress={() => {
                        close();
                        navigation.navigate(ScreenNames.SUPPORT_SCREEN, {
                          trip: item,
                          ticketId: item.ticketId,
                          newTicket: !item.ticketId,
                        });
                      }}
                      style={styles.toolTipOptions}
                      text={'Support'}
                      textStyle={styles.toolTipOptionsText}
                    />
                  </View>
                );
              }}
              withPointer={true}>
              <MaterialCommunityIcons
                name={'dots-vertical'}
                color={colors.secondary}
                size={22}
              />
            </Tooltip>
          </View>
          {item.ticketId ? (
            <Label text={'Ticket raised'} textStyle={styles.supportStatus} />
          ) : null}
          <Label
            text={
              tripStatus === DRIVER_STATUS.WAITING_FOR_USER_PAYMENT
                ? 'Waiting for your payment'
                : tripStatus
            }
            style={{
              ...styles.tripStatus,
              color: tripCompleted ? colors.secondary : colors.tertiaryYellow,
            }}
          />
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <View style={styles.container}>
      {!pastOrders?.length ? (
        <View style={styles.noOrders} pointerEvents="box-none">
          <Label
            text={"You made no orders!\nLet's try ordering some grocery."}
            textStyle={styles.noOrdersText}
          />
        </View>
      ) : null}
      <FlatList
        data={pastOrders}
        renderItem={renderItem}
        style={styles.flatlist}
        refreshing={pastOrdersLoading}
        onRefresh={onRefresh}
      />
      <Modal
        animationIn="slideInUp"
        animationOut="slideOutDown"
        onModalClose={() => setShowOrderModal(false)}
        hasBackdrop={true}
        onBackdropPress={() => setShowOrderModal(false)}
        visible={showOrderModal && orderDetail}>
        <SafeAreaView style={styles.tripDetailModal}>
          <View style={styles.tripDetailHeader}>
            <Label
              text={'Order detail'}
              textStyle={styles.tripDetailHeaderText}
            />
            <TouchableOpacity onPress={() => setShowOrderModal(false)}>
              <MaterialCommunityIcons
                name="close-circle-outline"
                color={colors.black}
                size={28}
              />
            </TouchableOpacity>
          </View>
          {orderDetail ? (
            <View style={styles.tripDetailContainer}>
              <OrderInfo
                info={
                  new Date(orderDetail.createdAt).toDateString() +
                  ', ' +
                  new Date(orderDetail.createdAt).toLocaleTimeString()
                }
                title={'Order date: '}
              />
              <OrderInfo
                title={'Trip type: '}
                info={orderDetail.tripType || 'Mail'}
              />
              {orderDetail.tripType?.toLowerCase().includes('rent') ? (
                <OrderInfo
                  info={`${
                    orderDetail.totalHour /* || orderDetailbookingHours */
                  } hours`}
                  title={'Ride time: '}
                />
              ) : (
                <OrderInfo
                  info={
                    orderDetail.dropoff_Location.address_name +
                    ', ' +
                    orderDetail.dropoff_Location.address
                  }
                  title={'Delivery Address: '}
                />
              )}
              <OrderInfo
                info={
                  orderDetail.pickup_Location.address_name +
                  ', ' +
                  orderDetail.pickup_Location.address
                }
                title={'Pickup Address: '}
              />
              <OrderInfo
                info={
                  '$' +
                  Number(
                    orderDetail.Fare?.itemsBill +
                      orderDetail.Fare?.deliveryCharges?.totalFare,
                  ).toFixed(2)
                }
                title={'Fare: '}
              />
              <OrderInfo
                info={
                  orderDetail.tripType?.toLowerCase().includes('rent')
                    ? 'Successful ride'
                    : 'Delivered successfully!'
                }
                title={
                  orderDetail.tripType?.toLowerCase().includes('rent')
                    ? 'Ride status: '
                    : 'Delivery status: '
                }
              />
              <OrderInfo
                info={'Raised successfully!'}
                title={'Ticket status: '}
              />
              <Button
                onPress={() => {
                  setShowOrderModal(false);
                }}
                style={styles.selectTripButton}
                text={'Close order details'}
                textStyle={styles.selectTripText}
              />
            </View>
          ) : null}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.greyLighter,
    flex: 1,
    justifyContent: 'center',
  },
  flatlist: {
    backgroundColor: colors.greyLighter,
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    width: '100%',
  },
  noOrders: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    zIndex: 1,
  },
  noOrdersText: {
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
    alignItems: 'flex-start',
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
  orderMenu: {
    //position: 'absolute',
    //right: 16,
    //top: 16,
    //zIndex: 1,
  },
  selectTripButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 8,
    bottom: 16,
    justifyContent: 'center',
    padding: 16,
    position: 'absolute',
    width: '100%',
  },
  selectTripText: {
    color: colors.white,
    fontSize: 18,
  },
  supportStatus: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 16,
    color: colors.white,
    fontSize: 14,
    marginVertical: 6,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  tooltip: {
    backgroundColor: colors.secondary,
    elevation: 8,
    padding: 8,
    shadowColor: 'rgba(0,0,0,0.12)',
    shadowOpacity: 1,
    shadowRadius: 8,
    flex: 1,
    height: 95,
    width: 232,
  },
  toolTipOptions: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    width: '100%',
  },
  toolTipOptionsText: {
    color: colors.secondary,
    fontSize: 16,
  },
  tripDetailContainer: {
    flex: 1,
    padding: 16,
    width: '100%',
  },
  tripDetailHeader: {
    alignItems: 'center',
    backgroundColor: colors.white,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 3,
    width: '100%',
  },
  tripDetailHeaderText: {
    color: colors.black,
    fontSize: 22,
    fontWeight: 'bold',
  },
  tripDetailModal: {
    backgroundColor: colors.white,
    bottom: 0,
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
  tripStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default MyOrdersScreen;
