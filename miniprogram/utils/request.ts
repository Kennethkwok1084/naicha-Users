// utils/request.ts
import { getStorage } from './storage';
import { API_BASE_URL, REQUEST_TIMEOUT, DEBUG } from '../config/index';

/**
 * API 响应类型
 */
export type ApiResponse<T = any> = {
  code: number;
  message: string;
  data?: T;
  trace_id?: string;
};

/**
 * 验证响应格式
 */
function isValidApiResponse(data: any): data is ApiResponse {
  return (
    data !== null &&
    typeof data === 'object' &&
    typeof data.code === 'number' &&
    typeof data.message === 'string'
  );
}

/**
 * 请求配置选项
 */
export interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  timeout?: number;
  needAuth?: boolean; // 是否需要认证
  needLoading?: boolean; // 是否显示 Loading
}

/**
 * 基础请求函数
 */
export function request<T = any>(options: RequestOptions): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    const {
      url,
      method = 'GET',
      data,
      header = {},
      timeout = REQUEST_TIMEOUT,
      needAuth = true
    } = options;

    // 构建完整 URL
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

    // 调试日志
    if (DEBUG) {
      console.log(`[Request] ${method} ${fullUrl}`, data);
    }

    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...header
    };
    
    // 为创建订单请求自动添加幂等性键
    if (method === 'POST' && url.includes('/orders') && !url.includes('/calculate')) {
      headers['Idempotency-Key'] = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      if (DEBUG) {
        console.log('[Request] 添加幂等性键:', headers['Idempotency-Key']);
      }
    }

    // 添加认证信息
    if (needAuth) {
      const token = getStorage<string>('access_token') || getStorage<string>('token');
      const guestSession = getStorage<string>('guest_session_id');
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else if (guestSession) {
        headers['X-Guest-Session'] = guestSession;
      }
    }

    // 发起请求
    wx.request({
      url: fullUrl,
      method,
      data,
      header: headers,
      timeout,
      success: (res) => {
        // HTTP 状态码处理
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 兼容两种响应格式：
          // 1. 统一格式: { code: 0, message: "success", data: {...} }
          // 2. 直接数据: {...}
          
          if (isValidApiResponse(res.data)) {
            // 标准格式
            const result = res.data as ApiResponse<T>;
            
            // 业务错误码处理
            if (result.code === 0) {
              resolve(result);
            } else {
              // 业务错误
              wx.showToast({
                title: result.message || '请求失败',
                icon: 'none',
                duration: 2000
              });
              reject(result);
            }
          } else {
            // 直接数据格式，包装成标准格式
            const wrappedResponse: ApiResponse<T> = {
              code: 0,
              message: 'success',
              data: res.data as T
            };
            resolve(wrappedResponse);
          }
        } else if (res.statusCode === 401) {
          // 未授权，清除 token 并跳转登录
          wx.removeStorageSync('access_token');
          wx.showToast({
            title: '请先登录',
            icon: 'none'
          });
          reject({ statusCode: res.statusCode, data: res.data });
        } else if (res.statusCode === 422) {
          // 验证错误，打印详细信息
          console.error('[Request] 422 验证错误:', res.data);
          if (DEBUG) {
            console.error('[Request] 请求数据:', data);
          }
          wx.showToast({
            title: '数据格式错误',
            icon: 'none'
          });
          reject({ statusCode: res.statusCode, data: res.data });
        } else {
          // 其他 HTTP 错误
          console.error(`[Request] HTTP ${res.statusCode}:`, res.data);
          if (DEBUG) {
            console.error('[Request] 请求数据:', data);
          }
          wx.showToast({
            title: `请求失败 (${res.statusCode})`,
            icon: 'none'
          });
          reject({ statusCode: res.statusCode, data: res.data });
        }
      },
      fail: (error) => {
        console.error('请求失败:', error);
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
        reject(error);
      }
    });
  });
}

/**
 * 带自动重试的请求
 */
export async function requestWithRetry<T = any>(
  options: RequestOptions,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<ApiResponse<T>> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await request<T>(options);
    } catch (error) {
      lastError = error;
      
      // 如果是业务错误或 401，不重试
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }
      
      // 最后一次重试失败，直接抛出
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // 等待后重试（指数退避）
      await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, i)));
    }
  }
  
  throw lastError;
}

/**
 * 带 Loading 的请求
 */
export async function requestWithLoading<T = any>(
  options: RequestOptions,
  loadingText: string = '加载中...'
): Promise<ApiResponse<T>> {
  wx.showLoading({
    title: loadingText,
    mask: true
  });

  try {
    const result = await request<T>(options);
    wx.hideLoading();
    return result;
  } catch (error) {
    wx.hideLoading();
    throw error;
  }
}

/**
 * GET 请求简化方法
 */
export function get<T = any>(url: string, data?: any, options?: Partial<RequestOptions>): Promise<ApiResponse<T>> {
  return request<T>({
    url,
    method: 'GET',
    data,
    ...options
  });
}

/**
 * POST 请求简化方法
 */
export function post<T = any>(url: string, data?: any, options?: Partial<RequestOptions>): Promise<ApiResponse<T>> {
  return request<T>({
    url,
    method: 'POST',
    data,
    ...options
  });
}

/**
 * PUT 请求简化方法
 */
export function put<T = any>(url: string, data?: any, options?: Partial<RequestOptions>): Promise<ApiResponse<T>> {
  return request<T>({
    url,
    method: 'PUT',
    data,
    ...options
  });
}

/**
 * DELETE 请求简化方法
 */
export function del<T = any>(url: string, data?: any, options?: Partial<RequestOptions>): Promise<ApiResponse<T>> {
  return request<T>({
    url,
    method: 'DELETE',
    data,
    ...options
  });
}
