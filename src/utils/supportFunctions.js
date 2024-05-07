import axios from 'axios';
import {AUTH_TOKEN} from './otpFunctions';
import {getToken} from './storage';
import {AWS_BASE_URL} from '@env';

export const createSupportTicket = ({tripId, message}) => {
  return new Promise((resolve, reject) => {
    getToken(AUTH_TOKEN).then(token => {
      axios
        .post(
          `${AWS_BASE_URL}/customer/createTicket`,
          {
            tripId,
            message,
          },
          {
            headers: {
              authorization: `Bearer ${token}`,
            },
          },
        )
        .then(response => resolve(response.data))
        .catch(error => reject(error));
    });
  });
};

export const sendSupportMessage = ({ticketId, message}) => {
  return new Promise((resolve, reject) => {
    getToken(AUTH_TOKEN).then(token => {
      axios
        .post(
          `${AWS_BASE_URL}/customer/updateChat`,
          {
            isUser: true,
            message,
            ticketId,
          },
          {
            headers: {
              authorization: `Bearer ${token}`,
            },
          },
        )
        .then(response => resolve(response.data))
        .catch(error => reject(error));
    });
  });
};

export const getAllChats = ({ticketId}) => {
  return new Promise((resolve, reject) => {
    getToken(AUTH_TOKEN).then(token => {
      axios
        .post(
          `${AWS_BASE_URL}/customer/getAllChats`,
          {
            ticketId,
          },
          {
            headers: {
              authorization: `Bearer ${token}`,
            },
          },
        )
        .then(response => resolve(response.data))
        .catch(error => reject(error));
    });
  });
};
