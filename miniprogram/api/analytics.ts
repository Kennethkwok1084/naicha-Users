/**
 * 埋点 API 模块
 * 封装 POST /api/v1/analytics/events 接口
 */

import { request } from '../utils/request';
import type { BatchEventsRequest, AnalyticsHealthResponse } from '../../typings/analytics';

/**
 * 生成临时会话ID（用于游客模式）
 * 格式: guest_<timestamp>_<random>
 */
function generateGuestSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `guest_${timestamp}_${random}`;
}

/**
 * 确保游客会话ID存在
 * 如果不存在则生成一个临时ID
 */
async function ensureGuestSessionId(): Promise<string> {
  // 尝试获取已存在的会话ID
  let sessionId = wx.getStorageSync('guest_session_id');
  
  if (!sessionId) {
    // 生成临时会话ID
    sessionId = generateGuestSessionId();
    wx.setStorageSync('guest_session_id', sessionId);
    
    // 尝试向后端注册（可选，如果失败也不影响埋点）
    try {
      await request({
        url: '/api/v1/guests/session',
        method: 'POST',
        data: { session_token: sessionId },
        needAuth: false,
        needLoading: false,
      });
    } catch (error) {
      // 注册失败不影响埋点，使用本地生成的ID
      console.warn('[Analytics] 游客会话注册失败，使用本地ID:', error);
    }
  }
  
  return sessionId;
}

/**
 * 批量上报用户行为埋点
 * 
 * 限制：
 * - 单次最多10条事件
 * - 每条事件 payload 不超过 8KB
 * - 匿名用户必须提供 X-Session-Id 请求头
 * - 限流: 100次/分钟/IP
 * 
 * 幂等性：
 * 基于 event.id (UUID) 主键去重，重复事件会被自动忽略
 * 
 * 异步处理：
 * 事件会立即加入Celery队列，由Worker异步批量入库，API立即返回204
 * 
 * @param data 批量事件请求
 */
export async function batchReportEvents(data: BatchEventsRequest): Promise<void> {
  // 校验事件数量
  if (data.events.length > 10) {
    throw new Error('单次最多上报10条事件');
  }

  // 确保游客会话ID存在
  const sessionId = await ensureGuestSessionId();
  
  // 准备请求头
  const headers: Record<string, string> = {
    'X-Session-Id': sessionId, // 始终提供会话ID
  };

  await request<void>({
    url: '/api/v1/analytics/events',
    method: 'POST',
    data,
    header: headers,
    needAuth: false, // 埋点不强制要求登录
    needLoading: false, // 不显示加载提示
  });
}

/**
 * 埋点系统健康检查
 * 
 * 检查Celery队列积压情况，超过10000条事件告警
 */
export async function checkAnalyticsHealth(): Promise<AnalyticsHealthResponse> {
  const result = await request<AnalyticsHealthResponse>({
    url: '/api/v1/analytics/health',
    method: 'GET',
    needAuth: false,
    needLoading: false,
  });
  return result.data as AnalyticsHealthResponse;
}
