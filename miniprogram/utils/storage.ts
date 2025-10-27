// utils/storage.ts
/**
 * 本地存储工具函数
 */

/**
 * 同步获取本地存储
 */
export function getStorage<T = any>(key: string): T | null {
  try {
    return wx.getStorageSync(key);
  } catch (error) {
    console.error(`获取存储失败 [${key}]:`, error);
    return null;
  }
}

/**
 * 同步设置本地存储
 */
export function setStorage<T = any>(key: string, data: T): boolean {
  try {
    wx.setStorageSync(key, data);
    return true;
  } catch (error) {
    console.error(`设置存储失败 [${key}]:`, error);
    return false;
  }
}

/**
 * 同步移除本地存储
 */
export function removeStorage(key: string): boolean {
  try {
    wx.removeStorageSync(key);
    return true;
  } catch (error) {
    console.error(`移除存储失败 [${key}]:`, error);
    return false;
  }
}

/**
 * 同步清空本地存储
 */
export function clearStorage(): boolean {
  try {
    wx.clearStorageSync();
    return true;
  } catch (error) {
    console.error('清空存储失败:', error);
    return false;
  }
}
