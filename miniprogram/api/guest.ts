import { request } from '../utils/request';

export interface GuestSessionResponse {
  guest_session_id: string;
  expires_in?: number;
}

export const createGuestSession = () => {
  return request<GuestSessionResponse>({
    url: '/api/v1/guests/session',
    method: 'POST',
    needAuth: false,
  });
};
