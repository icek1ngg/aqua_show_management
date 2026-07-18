import apiClient from '../lib/apiClient.js';

export const startCheckoutPayment = async (payload) => {
  const response = await apiClient.post('/checkout/start-payment', payload);
  return response.data;
};
