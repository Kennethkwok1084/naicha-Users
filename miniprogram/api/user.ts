import { request } from '../utils/request';

export interface PhoneBindPayload {
  code: string;
  guest_session_id?: string | null;
}

export interface PhoneBindResponse {
  phone_number: string;
  from_guest_session?: boolean;
}

/**
 * 绑定手机号（getPhoneNumber code 换取明文手机号）
 */
export const bindPhoneNumber = (data: PhoneBindPayload) => {
  return request<PhoneBindResponse>({
    url: '/api/v1/users/phone/bind',
    method: 'POST',
    data,
  });
};
