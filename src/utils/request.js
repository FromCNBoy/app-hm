
// axios 请求相关操作封装到这里

import axios from 'axios'
import jsonBig from 'json-bigint'

const request = axios.create({
  // 请求的基础路径
  baseURL: 'http://ttapi.research.itcast.cn/'
})
// 配置处理后端返回数据中超出 js 安全整数范围问题
request.defaults.transformResponse = [function (data) {
  return data ? jsonBig.parse(data) : {} // 换了一个转化方法 使得 计算更精确 保证id不失真
}]
// 导出这个请求对象，哪里需要发请求，哪里就加载使用
export default request
