import axios from 'axios';
import {getToken} from '../../utils/storage';
import {AUTH_TOKEN} from '../../utils/otpFunctions';
import {AWS_BASE_URL} from '@env';
import {
  fetchPastOrders,
  fetchPastOrdersFail,
  fetchPastOrdersSucess,
} from '../reducers/UserReducer';

export const userMiddleware =
  ({dispatch}) =>
  next =>
  action => {
    if (action.type === fetchPastOrders.type) {
      next(action);
      getToken(AUTH_TOKEN).then(token => {
        axios
          .post(
            `${AWS_BASE_URL}/getUserPastOrders`,
            {},
            {
              headers: {
                authorization: `Bearer ${token}`,
              },
            },
          )
          .then(response => {
            console.log('Past ordres: ', response.data);
            const allOrders = [];
            allOrders.push(
              ...(response.data.ongoing_order?.map(order => ({
                ...order,
                onGoing: true,
              })) || []),
            );
            const pastOrders = (
              response.data.past_orders?.map(order => ({
                ...order,
                onGoing: false,
              })) || []
            ).sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            );
            allOrders.push(...pastOrders);
            dispatch(fetchPastOrdersSucess({pastOrders: allOrders}));
          })
          .catch(error => {
            console.log('Past trips fetch fail: ', error.message);
            dispatch(fetchPastOrdersFail({error: error.message}));
          });
      });
    } else {
      return next(action);
    }
  };
