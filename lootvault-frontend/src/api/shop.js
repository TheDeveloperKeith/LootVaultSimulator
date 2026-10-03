import { api } from "./client";

export const getShopOffers = () => api.get("/api/shop/offers");
export const buyShopOffer = (offerId) => api.post(`/api/shop/offers/${offerId}/buy`);
