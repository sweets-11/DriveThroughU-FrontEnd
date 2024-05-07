import React, {useContext, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {getAddresses as getSavedAddresses} from '../../store/selectors/AddressSelectors';
import colors from '../../config/colors';
import Label from '../Label';
import Modal from '../Modal';
import {ReactReduxContext} from 'react-redux';

const renderItem = ({item, loading, onAddressSelect, setShowAddressModal}) => {
  return (
    <TouchableOpacity
      disabled={loading}
      onPress={() => {
        Alert.alert(
          'Delete Address',
          'Are you sure you want to delete this address?',
          [
            {
              style: 'destructive',
              text: 'Delete',
              onPress: () => {
                onAddressSelect(item);
                //setShowAddressModal(false);
              },
            },
            {
              style: 'default',
              text: 'Cancel',
              onPress: () => {},
            },
          ],
        );
      }}
      style={styles.selectAddressContainer}>
      {loading ? (
        <ActivityIndicator
          color={colors.secondary}
          size={'large'}
          style={styles.loadingIndicator}
        />
      ) : null}
      <View style={styles.selectAddress}>
        <View style={styles.itemIcon}>
          <View style={styles.itemIconCircle}>
            <MaterialCommunityIcons
              name="office-building"
              color={colors.primary}
              size={28}
            />
          </View>
        </View>
        <View style={styles.addressContainer}>
          <Label text={item.address.name} textStyle={styles.addressName} />
          <Label
            text={item.address.buildingDetails}
            textStyle={styles.addressValue}
          />
          <Label
            text={item.address.value}
            textStyle={{...styles.addressValue, fontSize: 13}}
          />
        </View>
        <View style={styles.editIcon}>
          <MaterialCommunityIcons name="delete" color={colors.red} size={18} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const FlatlistHeader = ({setShowAddressModal}) => {
  return (
    <View style={styles.flatlistHeader}>
      <Label
        text={'Saved Addresses'}
        textStyle={styles.savedAddressHeaderText}
      />
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setShowAddressModal(false)}>
        <MaterialCommunityIcons
          name="close-circle"
          color={colors.white}
          size={28}
        />
      </TouchableOpacity>
    </View>
  );
};

const Address = ({
  addAddressAction,
  showAddressModal,
  onAddressSelect,
  setShowAddressModal,
  loading = false,
}) => {
  const {store} = useContext(ReactReduxContext);
  const [savedAddress, setSavedAddresses] = useState(
    getSavedAddresses(store.getState()),
  );
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setSavedAddresses(getSavedAddresses(store.getState()));
    });

    return () => {
      unsubscribe();
    };
  }, [store]);
  return (
    <Modal
      animationIn="slideInUp"
      animationOut="slideOutDown"
      onModalClose={() => setShowAddressModal(false)}
      hasBackdrop={true}
      onBackdropPress={() => setShowAddressModal(false)}
      visible={showAddressModal}>
      <SafeAreaView style={styles.modal}>
        <FlatlistHeader
          addAddressAction={addAddressAction}
          setShowAddressModal={setShowAddressModal}
        />
        <FlatList
          data={savedAddress || []}
          renderItem={({item, index}) =>
            renderItem({
              item,
              index,
              loading,
              onAddressSelect,
              setShowAddressModal,
            })
          }
          style={{
            backgroundColor: colors.white,
            width: '100%',
          }}
        />
        <TouchableOpacity
          onPress={() => {
            setShowAddressModal(false);
            addAddressAction();
          }}
          style={styles.addAddressButton}>
          <MaterialCommunityIcons
            name="map-marker-plus"
            color={colors.white}
            size={28}
          />
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  addAddressButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 100,
    bottom: 64,
    right: 16,
    justifyContent: 'center',
    padding: 16,
    position: 'absolute',
  },
  addAddressText: {
    color: colors.black,
    fontSize: 22,
  },
  addressDetailsContainer: {
    paddingVertical: 16,
    marginLeft: 8,
  },
  addressContainer: {
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    height: '100%',
    justifyContent: 'center',
    marginRight: 34,
    padding: 16,
    flex: 1,
    width: '100%',
  },
  addressName: {
    color: colors.tertiary,
    fontSize: 18,
  },
  addressValue: {
    color: colors.greyDark,
    fontSize: 14,
  },
  editIcon: {
    borderRadius: 4,
    borderColor: colors.neutralGrey,
    borderWidth: 1,
    bottom: 16,
    padding: 4,
    position: 'absolute',
    right: 8,
  },
  flatlistHeader: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    width: '100%',
  },
  itemIcon: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    justifyContent: 'center',
    padding: 16,
  },
  itemIconCircle: {
    backgroundColor: colors.white,
    borderRadius: 100,
    padding: 8,
  },
  loadingIndicator: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#fff5',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 1,
    height: '100%',
    width: '100%',
  },
  modal: {
    backgroundColor: colors.white,
    overflow: 'hidden',
    width: '100%',
    height: '100%',
  },
  savedAddressHeaderText: {
    color: colors.white,
    fontSize: 20,
  },
  selectAddressContainer: {
    elevation: 3,
    paddingHorizontal: 16,
    marginVertical: 8,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 3,
    width: '100%',
    flex: 1,
  },
  selectAddress: {
    borderRadius: 4,
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    width: '100%',
    backgroundColor: colors.white,
  },
});

export default Address;
