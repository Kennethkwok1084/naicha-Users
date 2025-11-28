import { observable, action } from 'mobx-miniprogram';
import { getStorage, setStorage, removeStorage } from '../utils/storage';

export const userStore = observable({
  token: getStorage('token') || '',
  userInfo: getStorage('userInfo') || null,

  setToken: action(function (token: string) {
    // @ts-ignore
    this.token = token;
    setStorage('token', token);
  }),

  setUserInfo: action(function (userInfo: any) {
    // @ts-ignore
    this.userInfo = userInfo;
    setStorage('userInfo', userInfo);
  }),

  login: action(async function () {
    // TODO: Implement actual login
    console.log('Login action called');
  }),

  logout: action(function () {
    // @ts-ignore
    this.token = '';
    // @ts-ignore
    this.userInfo = null;
    removeStorage('token');
    removeStorage('userInfo');
  })
});
