import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  dailyPayOuts: {
    currentPage: 1,
    data: [],
    error: null,
    loading: false,
    nextPage: null,
  },
  transfers: {
    currentPage: 1,
    data: [],
    error: null,
    loading: false,
    nextPage: null,
  },
};

const slice = createSlice({
  name: 'DriverPayments',
  initialState,
  reducers: {
    fetchDailyPayouts: (state, action) => {
      state.dailyPayOuts.loading = true;
    },
    fetchDailyPayoutsSuccess: (state, action) => {
      const {currentPage, data, nextPage, refresh} = action.payload;
      if (refresh) {
        state.dailyPayOuts.data = data;
      } else {
        state.dailyPayOuts.data.push(...data);
      }
      state.dailyPayOuts.currentPage = currentPage;
      state.dailyPayOuts.nextPage = nextPage;
      state.dailyPayOuts.loading = false;
      state.dailyPayOuts.error = null;
    },
    fetchDailyPayoutsFailed: (state, action) => {
      state.dailyPayOuts.loading = false;
      state.dailyPayOuts.error = action.payload.error;
    },
    fetchTransfers: (state, action) => {
      state.transfers.loading = true;
    },
    fetchTransfersSuccess: (state, action) => {
      const {currentPage, data, nextPage, refresh} = action.payload;
      if (refresh) {
        state.transfers.data = data;
      } else {
        state.transfers.data.push(...data);
      }
      state.transfers.currentPage = currentPage;
      state.transfers.nextPage = nextPage;
      state.transfers.loading = false;
      state.dailyPayOuts.error = null;
    },
    fetchTransfersFailed: (state, action) => {
      state.transfers.loading = false;
      state.transfers.error = action.payload.error;
    },
  },
});

export default slice.reducer;
export const {
  fetchDailyPayouts,
  fetchDailyPayoutsSuccess,
  fetchDailyPayoutsFailed,
  fetchTransfers,
  fetchTransfersSuccess,
  fetchTransfersFailed,
} = slice.actions;
