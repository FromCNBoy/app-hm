<template>
  <div class="login">
    <!-- 导航栏 -->
    <van-nav-bar title="登录" />
    <!-- /导航栏 -->

    <!-- 登录表单 -->
    <ValidationObserver ref="loginForm">
      <van-cell-group>
        <ValidationProvider name="手机号" rules="required" v-slot="{ errors }">
          <van-field
            v-model="user.mobile"
            required
            clearable
            label="手机号"
            placeholder="请输入手机号"
            :error-message="errors[0]"
          />
        </ValidationProvider>
        <!--  name 提示的文本   rules 验证规则    required 必填项
        v-slot="{ errors }" 获取校验结果数据  errors[0] 读取校验结果的失败信息-->
        <ValidationProvider name="验证码" rules="required|min:6|max:6" v-slot="{ errors }">
          <van-field
            v-model="user.code"
            type="password"
            label="验证码"
            placeholder="请输入验证码"
            required
            :error-message="errors[0]"
          />
        </ValidationProvider>
      </van-cell-group>
    </ValidationObserver>

    <!-- /登录表单 -->

    <!-- 登录按钮 -->
    <div class="btn-wrap">
      <van-button class="btn" type="info" @click="onLogin">登录</van-button>
    </div>
    <!-- /登录按钮 -->
  </div>
</template>

<script>
import { login } from '@/api/user'
import { setItem } from '@/utils/storage'

export default {
  name: 'LoginIndex',
  data () {
    return {
      user: {
        mobile: '15100000000',
        code: '246810'
      }
    }
  },
  methods: {
    async onLogin () {
      // 表单验证
      const isValid = await this.$refs.loginForm.validate()
      if (!isValid) {
        return
      }

      // 验证通过，loading，请求
      this.$toast.loading({
        duration: 0, // 持续展示 toast
        forbidClick: true, // 禁用背景点击
        loadingType: 'spinner',
        message: '登录中'
      })
      try {
        // 请求提交表单数据
        const { data } = await login(this.user)
        console.log(data)

        // 登录成功，将 token 存储到 Vuex 容器中
        this.$store.commit('setUser', data.data)
        // 为了防止页面刷新数据丢失，我们需要把数据放到本地存储
        setItem('user', data.data)

        this.$toast.success('登录成功')
      } catch (err) {
        if (err.response && err.response.status === 400) {
          this.$toast.fail('登录失败，手机号或验证码错误')
        }
      }
    }
  }
}
</script>

<style lang="less" scoped>
.login {
  .btn-wrap {
    padding: 20px;
    .btn {
      width: 100%;
      border-radius: 5px;
      background-color: #6db4fb;
      color: #fff;
    }
  }
}
</style>
