/**
 * 用户相关接口封装模块
 */
import request from '@/utils/request'

export const login = (user) => {
  return request({
    method: 'POST',
    url: '/app/v1_0/authorizations',
    data: user
  })
}

/**
 * 关注用户
 */
export function followUser (userId) {
  return request({
    method: 'POST',
    url: '/app/v1_0/user/followings',
    data: {
      target: userId // 用户id
    }
  })
}

/**
 * 取消关注用户
 */
export function unFollowUser (userId) {
  return request({
    method: 'DELETE',
    url: '/app/v1_0/user/followings/' + userId
  })
}
