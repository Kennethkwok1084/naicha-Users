// utils/request.ts
import { z } from 'zod';
import { getStorage } from './storage';

/**
 * API 基础地址
 * TODO: 根据环境配置
 */
const BASE_URL = 'https://your-api-domain.com';

/**
 * 后端统一响应格式 Schema
 */
const ApiResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.any().optional(),
  trace_id: z.string().optional()
});

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
      timeout = 30000,
      needAuth = true
    } = options;

    // 构建完整 URL
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;

    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...header
    };

    // 添加认证信息
    if (needAuth) {
      const token = getStorage<string>('access_token');
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
          try {
            // 校验响应格式
            const result = ApiResponseSchema.parse(res.data);
            
            // 业务错误码处理
            if (result.code === 0) {
              resolve(result as ApiResponse<T>);
            } else {
              // 业务错误
              wx.showToast({
                title: result.message || '请求失败',
                icon: 'none',
                duration: 2000
              });
              reject(result);
            }
          } catch (error) {
            console.error('响应格式错误:', error);
            wx.showToast({
              title: '数据格式错误',
              icon: 'none'
            });
            reject(error);
          }
        } else if (res.statusCode === 401) {
          // 未授权，清除 token 并跳转登录
          wx.removeStorageSync('access_token');
          wx.showToast({
            title: '请先登录',
            icon: 'none'
          });
          // 可以跳转到登录页
          // wx.navigateTo({ url: '/pages/login/login' });
          reject(new Error('未授权'));
        } else {
          // 其他 HTTP 错误
          wx.showToast({
            title: `请求失败 (${res.statusCode})`,
            icon: 'none'
          });
          reject(new Error(`HTTP ${res.statusCode}`));
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
