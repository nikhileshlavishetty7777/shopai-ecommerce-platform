import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartService } from '../../services/endpoints';
import { toast } from 'react-toastify';

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await cartService.get();
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail);
  }
});

export const addToCart = createAsyncThunk('cart/add', async ({ productId, quantity = 1 }, { dispatch, rejectWithValue }) => {
  try {
    await cartService.addItem({ product_id: productId, quantity });
    toast.success('Added to cart!');
    dispatch(fetchCart());
  } catch (err) {
    const msg = err.response?.data?.detail || 'Failed to add to cart';
    toast.error(msg);
    return rejectWithValue(msg);
  }
});

export const updateCartItem = createAsyncThunk('cart/update', async ({ itemId, quantity }, { dispatch, rejectWithValue }) => {
  try {
    await cartService.updateItem(itemId, { quantity });
    dispatch(fetchCart());
  } catch (err) {
    toast.error(err.response?.data?.detail || 'Failed to update cart');
    return rejectWithValue(err.response?.data?.detail);
  }
});

export const removeCartItem = createAsyncThunk('cart/remove', async (itemId, { dispatch, rejectWithValue }) => {
  try {
    await cartService.removeItem(itemId);
    toast.info('Item removed from cart');
    dispatch(fetchCart());
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail);
  }
});

const initialState = {
  items: [],
  totalItems: 0,
  subtotal: 0,
  loading: false,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    resetCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.subtotal = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.totalItems = action.payload.total_items;
        state.subtotal = action.payload.subtotal;
      })
      .addCase(fetchCart.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { resetCart } = cartSlice.actions;
export default cartSlice.reducer;
