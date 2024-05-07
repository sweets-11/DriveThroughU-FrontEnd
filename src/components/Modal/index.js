import React, {useEffect, useState} from 'react';
import Modal from 'react-native-modal';
import {View} from 'react-native';

const ModalComponent = ({
  animationType,
  children,
  onModalClose,
  transparent,
  visible,
  disableClose,
  ...rest
}) => {
  const [modalVisible, setModalVisible] = useState(visible);
  useEffect(() => setModalVisible(visible), [visible]);
  const handleClose = () => {
    if (disableClose) {
      return;
    }
    setModalVisible(false);
    onModalClose();
  };

  return (
    <Modal
      isVisible={modalVisible}
      onBackButtonPress={handleClose}
      onRequestClose={handleClose}
      onBackdropPress={handleClose}
      style={{margin: 0}}
      useNativeDriver={true}
      {...rest}>
      <View
        pointerEvents="box-none"
        style={{
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
        }}>
        {children}
      </View>
    </Modal>
  );
};

export default ModalComponent;
