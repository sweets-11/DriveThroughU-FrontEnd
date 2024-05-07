import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Alert, StyleSheet, View} from 'react-native';
import {StripeProvider, useStripe} from '@stripe/stripe-react-native';
import {STRIPE_PUBLISHABLE_KEY} from '@env';
import {AWS_BASE_URL} from '@env';

import colors from '../config/colors';
import Button from '../components/Button';
import axios from 'axios';
import {getToken} from '../utils/storage';
import {AUTH_TOKEN} from '../utils/otpFunctions';

const PaymentScreen = ({
  amount = {
    itemsBill: 0,
    deliveryCharges: {X: 0, Y: 0, Z: 0, taxRate: 0, totalFare: 0},
  },
  setPaymentMade = () => {},
  style = {},
  tripId,
}) => {
  const [enableButton, setEnableButton] = useState(false);
  const [initPaymentError, setInitPaymentError] = useState(false);
  const {initPaymentSheet, presentPaymentSheet} = useStripe();
  const totalCharges = useMemo(
    () => amount.itemsBill + amount.deliveryCharges?.totalFare || 0,
    [amount],
  );

  const initializePaymentSheet = useCallback(() => {
    return new Promise((resolve, reject) => {
      getToken(AUTH_TOKEN).then(token => {
        axios
          .post(
            `${AWS_BASE_URL}/order/processPayment`,
            {
              totalAmount: Number(totalCharges).toFixed(2),
              tripId: tripId,
            },
            {
              headers: {
                authorization: `Bearer ${token}`,
              },
            },
          )
          .then(async paymentIntentResponse => {
            const customer = paymentIntentResponse.data.customerId;
            const client_secret = paymentIntentResponse.data.client_secret;
            const customerEphemeralKeySecret =
              paymentIntentResponse.data.ephemeralKey?.secret;
            const {error} = await initPaymentSheet({
              merchantDisplayName: 'DriveThroughU, Inc.',
              customerId: customer,
              customerEphemeralKeySecret,
              paymentIntentClientSecret: client_secret,
              // Set `allowsDelayedPaymentMethods` to true if your business can handle payment
              //methods that complete payment after a delay, like SEPA Debit and Sofort.
              allowsDelayedPaymentMethods: false,
            });
            setInitPaymentError(error);
            resolve();
            if (!error) {
              console.log('initialized');
            } else {
              console.log('Error: ', error);
            }
          })
          .catch(error => {
            console.log('error in initialization payment: ', error);
            reject();
            setInitPaymentError(error);
          });
      });
    });
  }, [totalCharges, initPaymentSheet, tripId]);

  useEffect(() => {
    initializePaymentSheet()
      .then(() => {
        setEnableButton(true);
      })
      .catch(error => console.log('error in intializing: ', error));
  }, [initializePaymentSheet]);

  const openPaymentSheet = async () => {
    const {error} = await presentPaymentSheet();

    if (error) {
      Alert.alert('Payment error', error.message);
      setPaymentMade(false);
    } else {
      Alert.alert('Success', 'Your payment is successful!');
      setPaymentMade(true);
    }
  };

  return (
    <View style={{...styles.container, ...style}}>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
        {enableButton ? (
          <Button
            disabled={!enableButton || initPaymentError}
            text={
              initPaymentError
                ? 'Payment initialization failed!'
                : `Pay $${Number(totalCharges).toFixed(2)}`
            }
            textStyle={styles.payButtonText}
            style={{
              ...styles.payButton,
              backgroundColor: initPaymentError
                ? colors.red
                : colors.tertiaryBlue,
            }}
            onPress={openPaymentSheet}
          />
        ) : (
          <ActivityIndicator style={styles.payButton} color={colors.white} />
        )}
      </StripeProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
  },
  payButton: {
    width: '100%',
    backgroundColor: colors.tertiaryBlue,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    color: colors.white,
    fontSize: 22,
  },
});

export default PaymentScreen;
