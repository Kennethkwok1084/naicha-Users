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
 * 订单列表项
 */
export interface OrderListItem {
  order_id: number;
  order_number: string;
  status: 'pending_payment' | 'paid' | 'in_production' | 'ready_for_pickup' | 'completed' | 'cancelled' | 'refund_pending' | 'refunded';
  order_type: 'pickup' | 'delivery';
  total_price: number;
  created_at: string;
  is_scheduled: boolean;
  scheduled_at?: string | null;
  eta_minutes?: number | null;
  eta_text?: string | null;
  pickup_code?: string | null;
  items: Array<{
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    selected_specs: Array<{
      spec_id: number;
      option_id: number;
      option_name?: string;
      price_modifier?: number | null;
    }>;
  }>;
}

/**
 * 获取订单列表
 * @param status - 订单状态筛选，空表示全部
 * @param limit - 每页数量
 * @param offset - 偏移量
 */
export const getOrderList = async (
  status?: string,
  limit: number = 20,
  offset: number = 0
): Promise<OrderListItem[]> => {
  // 构建查询参数
  const queryParams: string[] = [
    `limit=${limit}`,
    `offset=${offset}`,
  ];
  
  if (status && status !== 'all') {
    queryParams.push(`status=${status}`);
  }
  
  const queryString = queryParams.join('&');
  
  try {
    const response = await request<OrderListItem[]>({
      url: `/api/v1/me/orders?${queryString}`,
      method: 'GET',
    });
    
    // 返回数据，兼容两种格式
    return response.data || response as any || [];
  } catch (error) {
    console.error('[Order API] 获取订单列表失败:', error);
    throw error;
  }
};

/**
 * 获取订单详情
 */
export const getOrderDetail = (orderId: number) => {
  return request<OrderListItem>({
    url: `/api/v1/orders/${orderId}`,
    method: 'GET',
  });
};

/**
 * 取消订单（仅待支付状态）
 */
export const cancelOrder = (orderId: number) => {
  return request<{ success: boolean; message?: string }>({
    url: `/api/v1/orders/${orderId}/cancel`,
    method: 'POST',
  });
};
