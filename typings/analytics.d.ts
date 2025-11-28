/**
 * 埋点事件类型定义
 * 基于后端 OpenAPI: /api/v1/analytics/events
 */

/**
 * 事件类型
 * - event: 用户操作事件（点击、加购等）
 * - page: 页面访问事件
 * - user: 用户属性更新事件
 */
export type AnalyticsEventType = 'event' | 'page' | 'user';

/**
 * 单个埋点事件
 */
export interface AnalyticsEvent {
  /** 事件唯一ID（UUID v4），用于去重 */
  id: string;
  
  /** 事件类型 */
  type: AnalyticsEventType;
  
  /** 事件名称（如：product_view, add_to_cart, page_view） */
  name: string;
  
  /** 事件发生时间（Unix 毫秒时间戳） */
  timestamp: number;
  
  /** 事件载荷（最大 8KB） */
  payload?: Record<string, any>;
}

/**
 * 批量上报请求
 * 限制：
 * - 单次最多 10 条事件
 * - 每条事件 payload 不超过 8KB
 */
export interface BatchEventsRequest {
  events: AnalyticsEvent[];
}

/**
 * 页面访问事件 payload
 */
export interface PageViewPayload {
  /** 页面路径 */
  page_path: string;
  
  /** 页面标题 */
  page_title?: string;
  
  /** 来源页面 */
  referrer?: string;
  
  /** 页面参数 */
  query?: Record<string, any>;
  
  /** 停留时长（毫秒） */
  duration?: number;
}

/**
 * 用户操作事件 payload（基础字段）
 */
export interface EventPayload {
  /** 事件来源（页面路径） */
  source?: string;
  
  /** 事件目标（如商品ID、按钮ID） */
  target?: string;
  
  /** 额外属性 */
  [key: string]: any;
}

/**
 * 商品查看事件 payload
 */
export interface ProductViewPayload extends EventPayload {
  product_id: number;
  product_name: string;
  category_id?: number;
  price?: number;
}

/**
 * 加购事件 payload
 */
export interface AddToCartPayload extends EventPayload {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  selected_specs?: Array<{
    group_id: number;
    group_name: string;
    option_id: number;
    option_name: string;
    price_modifier: number;
  }>;
}

/**
 * 下单事件 payload
 */
export interface OrderCreatePayload extends EventPayload {
  order_id: number;
  order_number: string;
  order_type: 'pickup' | 'delivery';
  total_price: number;
  item_count: number;
  coupon_used?: boolean;
  points_used?: number;
}

/**
 * 支付事件 payload
 */
export interface PaymentPayload extends EventPayload {
  order_id: number;
  order_number: string;
  payment_channel: string;
  amount: number;
  status: 'success' | 'fail' | 'cancel';
  fail_reason?: string;
}

/**
 * 用户属性更新 payload
 */
export interface UserAttributesPayload {
  /** 用户ID */
  user_id?: number;
  
  /** 是否登录用户 */
  is_logged_in: boolean;
  
  /** 会话ID（游客） */
  session_id?: string;
  
  /** 用户标签 */
  tags?: string[];
  
  /** 自定义属性 */
  [key: string]: any;
}

/**
 * 埋点系统健康状态
 */
export interface AnalyticsHealthResponse {
  status: 'ok' | 'warning' | 'error';
  queue_size?: number;
  last_flush?: string;
}
