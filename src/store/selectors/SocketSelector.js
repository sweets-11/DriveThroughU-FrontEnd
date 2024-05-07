import {createSelector} from 'reselect';

export const getSocketConnecting = createSelector(
  state => state.Socket,
  socket => socket.connecting,
);
