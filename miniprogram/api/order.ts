import { request } from '../utils/request';

export interface OrderSpec {
  spec_id: number;
  option_id: number;
  option_name?: string;
  price_modifier?: number | null;
}

// 对应后端订单请求体
export interface OrderRequestPayload {
  shop_id: number;
  delivery_type: 'pickup' | 'delivery';
  dining_type?: 'dine-in' | 'takeout';
  scheduled_at?: string | null;
  address?: {
    address?: string;
    detail?: string;
    name?: string;
    phone?: string;
    lat?: number;
    lng?: number;
  } | null;
  user_phone?: string | null;
  coupon_id?: number | null;
  use_points?: boolean;
  notes?: string | null;
  items: Array<{
    product_id: number;
    quantity: number;
    selected_specs: OrderSpec[];
  }>;
  guest_session_id?: string | null;
}

// 价格试算响应
export interface OrderPriceResponse {
  subtotal: number;
  coupon_discount?: number;
  points_discount?: number;
  delivery_fee?: number;
  final_amount: number;
  breakdown?: Array<{
    label?: string;
    amount: number;
    type?: string;
  }>;
  eta_minutes?: number | null;
  eta_text?: string | null;
}

/**
 * 订单价格预览
 */
export const previewOrder = (data: OrderRequestPayload) => {
  return request<OrderPriceResponse>({
    url: '/api/v1/orders/preview',
    method: 'POST',
    data,
  });
};

/**
 * 订单价格试算
 */
export const calculateOrderPrice = (data: OrderRequestPayload) => {
  return request<OrderPriceResponse>({
    url: '/api/v1/orders/calculate-price',
    method: 'POST',
    data,
  });
};

/**
 * 创建订单
 */
export const createOrder = (data: OrderRequestPayload) => {
  return request<{ order_id: number; order_number: string }>({
    url: '/api/v1/orders',
    method: 'POST',
    data,
  });
};

/**
 * 获取订单详情
 */
export const getOrderDetail = (orderId: string) => {
  return request<any>({
    url: `/api/v1/orders/${orderId}`,
    method: 'GET',
  });
};
