import { request } from '../utils/request';

export interface WeChatLoginPayload {
  code: string;
  nickname?: string | null;
  avatar_url?: string | null;
}

export interface WeChatLoginResponse {
  access_token: string;
  refresh_token: string;
  user_id: number;
  is_new_user: boolean;
  token_type?: string;
  expires_in?: number;
}

/**
 * 微信小程序登录
 */
export const login = (data: WeChatLoginPayload) => {
  return request<WeChatLoginResponse>({
    url: '/api/v1/users/login',
    method: 'POST',
    data,
    needAuth: false, // 登录接口不需要认证
  });
};

export interface PhoneBindPayload {
  code: string;
  guest_session_id?: string | null;
}

export interface PhoneBindResponse {
  phone_number: string;
  from_guest_session?: boolean;
}

/**
 * 绑定手机号(getPhoneNumber code 换取明文手机号)
 */
export const bindPhoneNumber = (data: PhoneBindPayload) => {
  return request<PhoneBindResponse>({
    url: '/api/v1/users/phone/bind',
    method: 'POST',
    data,
  });
};

export interface StampStatus {
  current_stamps: number;
  next_reward_stamps: number;
  total_rewards_claimed: number;
}

/**
 * 获取集点进度
 */
export const getStampStatus = () => {
  return request<StampStatus>({
    url: '/api/v1/me/stamps',
    method: 'GET',
  });
};

export interface Coupon {
  coupon_id: number;
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  valid_from: string;
  valid_until: string;
  status: 'available' | 'used' | 'expired';
  usage_limit: number;
  used_count: number;
}

export interface CouponsResponse {
  available: Coupon[];
  unavailable: Coupon[];
}

/**
 * 获取用户优惠券列表
 */
export const getMyCoupons = () => {
  return request<CouponsResponse>({
    url: '/api/v1/me/coupons',
    method: 'GET',
  });
};

export interface UserInfo {
  user_id: number;
  nickname?: string;
  avatar_url?: string;
  phone_number?: string;
  created_at: string;
}

/**
 * 获取用户信息
 */
export const getUserInfo = () => {
  return request<UserInfo>({
    url: '/api/v1/me',
    method: 'GET',
  });
};
