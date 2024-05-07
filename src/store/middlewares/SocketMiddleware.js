import {
  findDriversSuccess,
  updateDriverLocation,
} from '../reducers/DriverReducer';
import {
  conectionError,
  connectionSuccessful,
  createConnection,
  disconnectSocket,
  sendData,
  socketDisconnected,
} from '../reducers/SocketReducer';
import {Socket, io} from 'socket.io-client';

const URL = 'http://localhost:8080/';
const SOCKET_ACTIONS = {
  CONNECTION_SUCCESS: 'conectionSuccess',
  DRIVER_FOUND: 'driverFound',
  DRIVER_LOCATION_UPDATE: 'driverLocationUpdate',
};
let socket = null;

const connectToSocket =
  ({dispatch}) =>
  next =>
  action => {
    if (action.type === createConnection.type) {
      next(action);
      socket = io(URL, {reconnectionAttempts: 3});

      //Pre-defined events
      socket.on('connect', () => {
        console.log('Connected to server: ', socket.id);
        dispatch(connectionSuccessful());
      });
      socket.on('disconnect', () => {
        console.log('Disconnected from server: ', socket.id);
        socket.disconnect();
        dispatch(socketDisconnected());
      });
      socket.on('connect_error', () => {
        dispatch(conectionError({error: "Socket didn't connect"}));
      });

      //Custom events
      socket.on(SOCKET_ACTIONS.CONNECTION_SUCCESS, () => {
        console.log('socket connected!: ', socket.connected);
      });
      socket.on(SOCKET_ACTIONS.DRIVER_LOCATION_UPDATE, location => {
        dispatch(updateDriverLocation({location}));
      });
    } else if (action.type === disconnectSocket.type) {
      next(action);
      if (socket) {
        socket.disconnect();
      } else {
        console.log('Socket is null');
      }
    } else if (action.type === sendData.type) {
      next(action);
      if (socket) {
        const {event, data} = action.payload;
        socket.emit(event, data);
      } else {
        console.log('Socket is');
      }
    } else {
      return next(action);
    }
  };

export {connectToSocket};
