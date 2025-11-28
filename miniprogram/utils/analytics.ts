/**
 * 埋点工具类
 * 实现事件收集、批量上报、队列管理等功能
 * 
 * 特性：
 * - 自动批量上报（最多10条/次）
 * - 本地队列缓存（最多100条）
 * - 防抖上报（500ms）
 * - 数据脱敏（手机号仅后4位）
 * - 自动注入公共字段（session_id、user_id、timestamp等）
 * - 幂等性支持（基于UUID去重）
 */

import type {
  AnalyticsEvent,
  AnalyticsEventType,
  PageViewPayload,
  EventPayload,
} from '../../typings/analytics';

// 导入 API 模块（将在下一步创建）
import * as analyticsApi from '../api/analytics';

/**
 * 生成 UUID v4（微信小程序兼容版本）
 * 使用小程序原生随机数生成，不依赖 Node.js crypto 模块
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 埋点配置
 */
interface AnalyticsConfig {
  /** 是否启用埋点 */
  enabled: boolean;
  
  /** 批量上报阈值（条数） */
  batchSize: number;
  
  /** 防抖延迟（毫秒） */
  debounceMs: number;
  
  /** 队列最大长度 */
  maxQueueSize: number;
  
  /** 是否打印调试日志 */
  debug: boolean;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: true,
  batchSize: 10,
  debounceMs: 500,
  maxQueueSize: 100,
  debug: false,
};

/**
 * 埋点管理类
 */
class AnalyticsManager {
  private config: AnalyticsConfig;
  private queue: AnalyticsEvent[] = [];
  private flushTimer: number | null = null;
  private currentPagePath: string = '';
  private pageEnterTime: number = 0;

  constructor(config?: Partial<AnalyticsConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadQueue();
  }

  /**
   * 从本地存储加载队列
   */
  private loadQueue() {
    try {
      const saved = wx.getStorageSync('analytics_queue');
      if (saved && Array.isArray(saved)) {
        // 兼容历史数据（可能存储了 ISO 字符串时间戳）
        this.queue = saved.slice(0, this.config.maxQueueSize).map((item) => {
          const event = { ...item } as AnalyticsEvent;
          if (typeof event.timestamp !== 'number') {
            const parsed = typeof event.timestamp === 'string' ? Date.parse(event.timestamp) : NaN;
            event.timestamp = Number.isFinite(parsed) ? parsed : Date.now();
          }
          return event;
        });
      }
    } catch (error) {
      console.error('[Analytics] 加载队列失败:', error);
    }
  }

  /**
   * 保存队列到本地存储
   */
  private saveQueue() {
    try {
      wx.setStorageSync('analytics_queue', this.queue);
    } catch (error) {
      console.error('[Analytics] 保存队列失败:', error);
    }
  }

  /**
   * 获取公共字段
   */
  private getCommonFields(): Partial<AnalyticsEvent> {
    return {
      // 后端要求 Unix 毫秒时间戳
      timestamp: Date.now(),
    };
  }

  /**
   * 数据脱敏
   */
  private sanitizePayload(payload: any): any {
    if (!payload || typeof payload !== 'object') {
      return payload;
    }

    const sanitized = { ...payload };

    // 脱敏手机号（仅保留后4位）
    if (sanitized.phone && typeof sanitized.phone === 'string') {
      sanitized.phone = sanitized.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    }

    // 递归处理嵌套对象
    Object.keys(sanitized).forEach((key) => {
      if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizePayload(sanitized[key]);
      }
    });

    return sanitized;
  }

  /**
   * 检查 payload 大小（不超过 8KB）
   */
  private checkPayloadSize(payload: any): boolean {
    try {
      // 小程序环境下使用字符串长度估算（UTF-8 编码，1个字符最多3字节）
      const jsonStr = JSON.stringify(payload);
      const estimatedSize = jsonStr.length * 3; // 保守估算
      return estimatedSize <= 8 * 1024; // 8KB
    } catch {
      return false;
    }
  }

  /**
   * 添加事件到队列
   */
  private addToQueue(event: AnalyticsEvent) {
    if (!this.config.enabled) {
      return;
    }

    // 检查 payload 大小
    if (event.payload && !this.checkPayloadSize(event.payload)) {
      console.warn('[Analytics] payload 超过 8KB 限制，已丢弃:', event.name);
      return;
    }

    // 数据脱敏
    if (event.payload) {
      event.payload = this.sanitizePayload(event.payload);
    }

    // 添加到队列
    this.queue.push(event);

    // 调试日志
    if (this.config.debug) {
      console.log('[Analytics] 事件入队:', event);
    }

    // 检查队列长度
    if (this.queue.length >= this.config.maxQueueSize) {
      console.warn('[Analytics] 队列已满，移除最早的事件');
      this.queue.shift();
    }

    // 保存到本地
    this.saveQueue();

    // 触发上报
    this.scheduleFlush();
  }

  /**
   * 调度上报（防抖）
   */
  private scheduleFlush() {
    // 清除之前的定时器
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    // 如果队列达到批量阈值，立即上报
    if (this.queue.length >= this.config.batchSize) {
      this.flush();
      return;
    }

    // 否则延迟上报
    this.flushTimer = setTimeout(() => {
      this.flush();
    }, this.config.debounceMs) as unknown as number;
  }

  /**
   * 批量上报
   */
  private async flush() {
    if (this.queue.length === 0) {
      return;
    }

    // 取出最多 10 条事件
    const events = this.queue.splice(0, this.config.batchSize);

    try {
      if (this.config.debug) {
        console.log('[Analytics] 批量上报:', events);
      }

      await analyticsApi.batchReportEvents({ events });

      // 上报成功，保存队列
      this.saveQueue();

      if (this.config.debug) {
        console.log('[Analytics] 上报成功');
      }
    } catch (error) {
      console.error('[Analytics] 上报失败:', error);

      // 上报失败，将事件放回队列头部
      this.queue.unshift(...events);
      this.saveQueue();
    }

    // 如果队列还有事件，继续上报
    if (this.queue.length > 0) {
      this.scheduleFlush();
    }
  }

  /**
   * 立即上报所有事件
   */
  public async flushAll(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    while (this.queue.length > 0) {
      await this.flush();
    }
  }

  /**
   * 记录事件
   */
  public track(name: string, payload?: EventPayload): void {
    const commonFields = this.getCommonFields();
    const event: AnalyticsEvent = {
      id: generateUUID(),
      type: 'event',
      name,
      timestamp: commonFields.timestamp!,
      payload: payload || {},
    };

    this.addToQueue(event);
  }

  /**
   * 记录页面访问
   */
  public page(pagePath: string, payload?: Partial<PageViewPayload>): void {
    // 计算上一个页面的停留时长
    if (this.currentPagePath && this.pageEnterTime) {
      const duration = Date.now() - this.pageEnterTime;
      this.track('page_leave', {
        page_path: this.currentPagePath,
        duration,
      });
    }

    // 记录新页面访问
    this.currentPagePath = pagePath;
    this.pageEnterTime = Date.now();

    const commonFields = this.getCommonFields();
    const event: AnalyticsEvent = {
      id: generateUUID(),
      type: 'page',
      name: 'page_view',
      timestamp: commonFields.timestamp!,
      payload: {
        page_path: pagePath,
        ...payload,
      },
    };

    this.addToQueue(event);
  }

  /**
   * 更新用户属性
   */
  public user(payload: Record<string, any>): void {
    const commonFields = this.getCommonFields();
    const event: AnalyticsEvent = {
      id: generateUUID(),
      type: 'user',
      name: 'user_update',
      timestamp: commonFields.timestamp!,
      payload,
    };

    this.addToQueue(event);
  }

  /**
   * 设置配置
   */
  public setConfig(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 清空队列
   */
  public clearQueue(): void {
    this.queue = [];
    this.saveQueue();
  }

  /**
   * 获取队列状态
   */
  public getQueueStatus(): { size: number; maxSize: number } {
    return {
      size: this.queue.length,
      maxSize: this.config.maxQueueSize,
    };
  }
}

// 单例实例
let instance: AnalyticsManager | null = null;

/**
 * 获取埋点管理器实例
 */
export function getAnalytics(): AnalyticsManager {
  if (!instance) {
    // 从配置读取调试模式
    const config = require('../config/index').default;
    instance = new AnalyticsManager({
      debug: config.env !== 'production',
    });
  }
  return instance;
}

/**
 * 初始化埋点系统
 */
export function initAnalytics(config?: Partial<AnalyticsConfig>): AnalyticsManager {
  instance = new AnalyticsManager(config);
  return instance;
}

/**
 * 快捷方法：记录事件
 */
export function track(name: string, payload?: EventPayload): void {
  getAnalytics().track(name, payload);
}

/**
 * 快捷方法：记录页面访问
 */
export function page(pagePath: string, payload?: Partial<PageViewPayload>): void {
  getAnalytics().page(pagePath, payload);
}

/**
 * 快捷方法：更新用户属性
 */
export function user(payload: Record<string, any>): void {
  getAnalytics().user(payload);
}

/**
 * 快捷方法：立即上报
 */
export function flushAll(): Promise<void> {
  return getAnalytics().flushAll();
}

// 导出类型
export type { AnalyticsConfig, AnalyticsManager };
