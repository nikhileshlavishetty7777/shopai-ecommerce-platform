import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { wishlistService } from '../../services/endpoints';
import { toast } from 'react-toastify';

export const fetchWishlist = createAsyncThunk('wishlist/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await wishlistService.get();
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail);
  }
});

export const toggleWishlistItem = createAsyncThunk('wishlist/toggle', async (productId, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await wishlistService.toggle(productId);
    toast.success(data.action === 'added' ? 'Added to wishlist!' : 'Removed from wishlist');
    dispatch(fetchWishlist());
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail);
  }
});

const initialState = {
  items: [],
  total: 0,
  loading: false,
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    resetWishlist: (state) => {
      state.items = [];
      state.total = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.total = action.payload.total;
      });
  },
});

export const { resetWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
