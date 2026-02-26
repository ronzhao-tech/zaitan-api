// 微信登录服务
import axios from 'axios';

interface WechatUserInfo {
  openid: string;
  unionid?: string;
  nickname?: string;
  headimgurl?: string;
}

// 通过微信code获取用户信息
export async function getWechatUserInfo(code: string): Promise<WechatUserInfo | null> {
  try {
    // 1. 获取access_token和openid
    const tokenRes = await axios.get('https://api.weixin.qq.com/sns/oauth2/access_token', {
      params: {
        appid: process.env.WECHAT_APPID,
        secret: process.env.WECHAT_SECRET,
        code,
        grant_type: 'authorization_code'
      }
    });

    if (tokenRes.data.errcode) {
      console.error('微信授权失败:', tokenRes.data);
      return null;
    }

    const { access_token, openid } = tokenRes.data;

    // 2. 获取用户信息
    const userRes = await axios.get('https://api.weixin.qq.com/sns/userinfo', {
      params: {
        access_token,
        openid,
        lang: 'zh_CN'
      }
    });

    if (userRes.data.errcode) {
      console.error('获取微信用户信息失败:', userRes.data);
      return null;
    }

    return {
      openid: userRes.data.openid,
      unionid: userRes.data.unionid,
      nickname: userRes.data.nickname,
      headimgurl: userRes.data.headimgurl
    };
  } catch (error) {
    console.error('微信登录错误:', error);
    return null;
  }
}
