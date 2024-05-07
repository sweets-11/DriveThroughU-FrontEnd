import axios from 'axios';
import {getToken} from '../../utils/storage';
import {AUTH_TOKEN} from '../../utils/otpFunctions';
import {
  fetchDailyPayouts,
  fetchDailyPayoutsFailed,
  fetchDailyPayoutsSuccess,
  fetchTransfers,
  fetchTransfersFailed,
  fetchTransfersSuccess,
} from '../reducers/DriverPaymentReducer';
import {AWS_BASE_URL} from '@env';

const fetchDailyPayOuts =
  ({dispatch}) =>
  next =>
  action => {
    if (action.type === fetchDailyPayouts.type) {
      next(action);
      getToken(AUTH_TOKEN)
        .then(token => {
          axios
            .post(
              `${AWS_BASE_URL}/order/payoutData?page=${action.payload.pageNumber}&limit=10`,
              {},
              {
                headers: {
                  authorization: `Bearer ${token}`,
                },
              },
            )
            .then(response => {
              const {currentPage, nextPage, responseData: data} = response.data;
              if (data) {
                dispatch(
                  fetchDailyPayoutsSuccess({
                    currentPage,
                    data,
                    nextPage,
                    refresh: action.payload.refresh,
                  }),
                );
              } else {
                dispatch(
                  fetchDailyPayoutsFailed({error: 'No payout data received'}),
                );
              }
            })
            .catch(error => {
              dispatch(fetchDailyPayoutsFailed({error: error.message}));
            });
        })
        .catch(error => {
          dispatch(fetchDailyPayoutsFailed({error}));
        });
    } else {
      return next(action);
    }
  };
const fetchTransfersData =
  ({dispatch}) =>
  next =>
  action => {
    if (action.type === fetchTransfers.type) {
      next(action);
      getToken(AUTH_TOKEN)
        .then(token => {
          axios
            .post(
              `${AWS_BASE_URL}/order/transferData?page=${action.payload.pageNumber}&limit=10`,
              {},
              {
                headers: {
                  authorization: `Bearer ${token}`,
                },
              },
            )
            .then(response => {
              const {currentPage, nextPage, responseData: data} = response.data;
              if (data) {
                dispatch(
                  fetchTransfersSuccess({
                    currentPage,
                    data,
                    nextPage,
                    refresh: action.payload.refresh,
                  }),
                );
              } else {
                dispatch(
                  fetchTransfersFailed({error: 'No transfers data received'}),
                );
              }
            })
            .catch(error => {
              dispatch(fetchTransfersFailed({error: error.message}));
            });
        })
        .catch(error => {
          dispatch(fetchTransfersFailed({error}));
        });
    } else {
      return next(action);
    }
  };

export {fetchDailyPayOuts, fetchTransfersData};
