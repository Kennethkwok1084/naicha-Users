/**
 * 页面埋点混入
 * 自动记录页面访问和停留时长
 * 
 * 使用方法：
 * ```typescript
 * import { pageAnalytics } from '../../utils/page-analytics';
 * 
 * Page({
 *   ...pageAnalytics,
 *   
 *   data: {
 *     // 你的数据
 *   },
 *   
 *   onLoad() {
 *     // 你的逻辑
 *   }
 * });
 * ```
 */

import { getAnalytics } from './analytics';

let pageStartTime: number = 0;
let currentPagePath: string = '';
let currentPageQuery: Record<string, any> = {};

/**
 * 页面埋点混入对象
 */
export const pageAnalytics = {
  /**
   * 页面加载
   */
  onLoad(this: WechatMiniprogram.Page.Instance<any, any>, options: Record<string, any>) {
    // 记录页面路径和参数
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    currentPagePath = `/${currentPage.route}`;
    currentPageQuery = options || {};
    pageStartTime = Date.now();

    // 记录页面访问
    getAnalytics().page(currentPagePath, {
      page_title: currentPage.route?.split('/').pop() || 'unknown',
      query: currentPageQuery,
      referrer: pages.length > 1 ? `/${pages[pages.length - 2].route}` : undefined,
    });
  },

  /**
   * 页面显示
   */
  onShow(this: WechatMiniprogram.Page.Instance<any, any>) {
    // 重新记录开始时间（从后台返回时）
    pageStartTime = Date.now();
  },

  /**
   * 页面隐藏
   */
  onHide(this: WechatMiniprogram.Page.Instance<any, any>) {
    // 记录页面停留时长
    const duration = Date.now() - pageStartTime;
    
    getAnalytics().track('page_hide', {
      page_path: currentPagePath,
      duration,
    });
  },

  /**
   * 页面卸载
   */
  onUnload(this: WechatMiniprogram.Page.Instance<any, any>) {
    // 记录页面离开
    const duration = Date.now() - pageStartTime;
    
    getAnalytics().track('page_leave', {
      page_path: currentPagePath,
      duration,
    });
  },

  /**
   * 页面分享
   */
  onShareAppMessage(this: WechatMiniprogram.Page.Instance<any, any>) {
    // 记录分享事件
    getAnalytics().track('page_share', {
      page_path: currentPagePath,
      query: currentPageQuery,
    });

    return {
      title: '分享标题',
      path: currentPagePath,
    };
  },
};

/**
 * 创建带埋点的页面
 * 
 * 使用方法：
 * ```typescript
 * import { createPageWithAnalytics } from '../../utils/page-analytics';
 * 
 * createPageWithAnalytics({
 *   data: {
 *     // 你的数据
 *   },
 *   
 *   onLoad() {
 *     // 你的逻辑
 *   }
 * });
 * ```
 */
export function createPageWithAnalytics<
  TData extends WechatMiniprogram.Page.DataOption,
  TCustom extends WechatMiniprogram.Page.CustomOption
>(options: WechatMiniprogram.Page.Options<TData, TCustom>) {
  // 合并生命周期方法
  const originalOnLoad = options.onLoad;
  const originalOnShow = options.onShow;
  const originalOnHide = options.onHide;
  const originalOnUnload = options.onUnload;
  const originalOnShareAppMessage = options.onShareAppMessage;

  options.onLoad = function (query: Record<string, string | undefined>) {
    pageAnalytics.onLoad.call(this, query);
    if (originalOnLoad) {
      originalOnLoad.call(this, query);
    }
  };

  options.onShow = function () {
    pageAnalytics.onShow.call(this);
    if (originalOnShow) {
      originalOnShow.call(this);
    }
  };

  options.onHide = function () {
    pageAnalytics.onHide.call(this);
    if (originalOnHide) {
      originalOnHide.call(this);
    }
  };

  options.onUnload = function () {
    pageAnalytics.onUnload.call(this);
    if (originalOnUnload) {
      originalOnUnload.call(this);
    }
  };

  if (originalOnShareAppMessage || options.onShareAppMessage) {
    options.onShareAppMessage = function (share: WechatMiniprogram.Page.IShareAppMessageOption) {
      const result = pageAnalytics.onShareAppMessage.call(this);
      if (originalOnShareAppMessage) {
        return originalOnShareAppMessage.call(this, share);
      }
      return result;
    };
  }

  Page(options);
}
