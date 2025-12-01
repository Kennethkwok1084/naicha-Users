/**
 * 认证工具函数
 */

/**
 * 检查是否已登录
 */
export function isLoggedIn(): boolean {
  const token = wx.getStorageSync('access_token');
  return !!token;
}

/**
 * 获取当前用户 ID
 */
export function getCurrentUserId(): number | null {
  const userId = wx.getStorageSync('user_id');
  return userId || null;
}

/**
 * 获取访问令牌
 */
export function getAccessToken(): string | null {
  return wx.getStorageSync('access_token') || null;
}

/**
 * 获取刷新令牌
 */
export function getRefreshToken(): string | null {
  return wx.getStorageSync('refresh_token') || null;
}

/**
 * 获取用户信息
 */
export function getUserProfile(): { nickname?: string; avatar_url?: string } | null {
  const nickname = wx.getStorageSync('user_nickname');
  const avatar_url = wx.getStorageSync('user_avatar');
  if (!nickname && !avatar_url) return null;
  return { nickname, avatar_url };
}

/**
 * 保存用户信息
 */
export function saveUserProfile(data: { nickname?: string; avatar_url?: string }): void {
  if (data.nickname) {
    wx.setStorageSync('user_nickname', data.nickname);
  }
  if (data.avatar_url) {
    wx.setStorageSync('user_avatar', data.avatar_url);
  }
}

/**
 * 清除登录信息
 */
export function clearAuth(): void {
  wx.removeStorageSync('access_token');
  wx.removeStorageSync('refresh_token');
  wx.removeStorageSync('user_id');
  wx.removeStorageSync('user_nickname');
  wx.removeStorageSync('user_avatar');
}

/**
 * 保存登录信息
 */
export function saveAuth(data: {
  access_token: string;
  refresh_token: string;
  user_id: number;
}): void {
  wx.setStorageSync('access_token', data.access_token);
  wx.setStorageSync('refresh_token', data.refresh_token);
  wx.setStorageSync('user_id', data.user_id);
}
