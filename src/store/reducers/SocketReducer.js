import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  connected: false,
  connecting: false,
  error: null,
};

const slice = createSlice({
  name: 'Socket',
  initialState,
  reducers: {
    createConnection: (state, action) => {
      state.connecting = true;
    },
    connectionSuccessful: (state, action) => {
      state.connecting = false;
      state.connected = true;
    },
    conectionError: (state, action) => {
      state.connecting = false;
      state.connected = false;
      state.connected = action.payload.error;
    },
    socketDisconnected: (state, action) => {
      state.connected = false;
    },
    disconnectSocket: (state, action) => {
      state.connected = false;
    },
    sendData: (state, action) => {},
  },
});

export default slice.reducer;
export const {
  createConnection,
  conectionError,
  connectionSuccessful,
  disconnectSocket,
  sendData,
  socketLocationUpdate,
  socketDisconnected,
} = slice.actions;
