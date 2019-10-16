<template>
  <div class="home">
    <!-- 导航栏 -->
    <van-nav-bar title="首页" fixed />
    <!-- /导航栏 -->

    <!-- 频道列表 -->
    <!-- v-model="active" 用来控制当前激活的频道索引 -->
    <van-tabs v-model="active">
      <van-tab :title="channel.name" v-for="channel in channels" :key="channel.id">
        <!-- 文章列表 -->

        <!-- loading  控制上拉加载更多的 loading 效果
          finished 控制是否已加载结束
          finished-text 加载结束的提示文本
          @load="onLoad" 上拉加载更多触发的事件

        列表组件会在初始化的时候自动触发 load 事件调用 onLoad 方法-->
        <van-list
          v-model="channel.loading"
          :finished="channel.finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <!-- 列表内容 -->
          <van-pull-refresh v-model="channel.isPullDownLoading" @refresh="onRefresh">
            <!-- <van-cell
                v-for="(article, index) in channel.articles"
                :key="index"
                :title="article.title"
            />-->
            <van-cell
              v-for="(article, index) in channel.articles"
              :key="index"
              :title="article.title"
            >
              <div slot="label">
                <van-grid :border="false" :column-num="3">
                  <van-grid-item v-for="(img, index) in article.cover.images" :key="index">
                    <van-image lazy-load height="80" :src="img" />
                  </van-grid-item>
                </van-grid>
                <div class="article-info">
                  <div class="meta">
                    <span>{{ article.aut_name }}</span>
                    <span>{{ article.comm_count }}评论</span>
                    <span>{{ article.pubdate | relativeTime }}</span>
                  </div>
                </div>
              </div>
            </van-cell>
          </van-pull-refresh>
          <!-- /列表内容 -->
        </van-list>
        <!-- /文章列表 -->
      </van-tab>
    </van-tabs>
    <!-- /频道列表 -->
  </div>
</template>

<script>
import { getDefaultChannels } from '@/api/channel'
import { getArticles } from '@/api/article'

export default {
  name: 'HomeIndex',
  data () {
    return {
      active: 0,
      // list: [],
      // loading: false,
      // finished: false,
      channels: [] // 频道列表
    }
  },

  created () {
    this.loadChannels()
  },

  methods: {
    async onLoad () {
      // 获取当期激活的频道对象
      const activeChannel = this.channels[this.active]
      // 1. 请求获取数据
      const { data } = await getArticles({
        channel_id: activeChannel.id, // 频道ID
        // 这里的这个时间戳就好比当前频道下一页的页码
        timestamp: activeChannel.timestamp || Date.now(), // 时间戳
        with_top: 1 // 是否包含置顶，1-包含置顶，0-不包含
      })

      // 2. 将数据添加到当前频道.articles中
      // activeChannel.articles = activeChannel.articles.concat(data.data.results)
      activeChannel.articles.push(...data.data.results)

      // 3. 结束当前频道.loging = false
      activeChannel.loading = false

      // 4. 如果还有下一页数据
      if (data.data.pre_timestamp) {
        // 更新获取下一页数据的页码时间戳
        activeChannel.timestamp = data.data.pre_timestamp
      } else {
        // 如果没有下一页数据了，就意味着后面没有数据了
        activeChannel.finished = true
      }
    },

    async loadChannels () {
      const { data } = await getDefaultChannels()
      const list = data.data.channels
      // console.log(list)
      list.forEach(channel => {
        channel.articles = [] // 存储频道的文章列表
        channel.finished = false // 存储频道的加载结束状态
        channel.loading = false // 存储频道的加载更多的 loading 状态
        channel.timestamp = null // 存储获取频道下一页的时间戳
        channel.isPullDownLoading = false // 存储频道的下拉刷新 loading 状态
      })
      this.channels = list
    },
    async onRefresh () {
      // 获取当期激活的频道对象
      const activeChannel = this.channels[this.active]

      // 1. 请求获取最新推荐的文章列表
      const { data } = await getArticles({
        channel_id: activeChannel.id,
        timestamp: Date.now(), // 下拉刷新永远都是在获取最新推荐的文章列表，所以传递当前最新时间戳
        with_top: 1
      })
      // 2. 将数据添加到文章列表顶部
      activeChannel.articles.unshift(...data.data.results)
      // 3. 关闭下拉刷新的 loading 状态
      activeChannel.isPullDownLoading = false
      // 4. 提示
      this.$toast('刷新成功')
    }
  }
}
</script>

<style lang="less" scoped>
.home {
  .van-tabs /deep/ .van-tabs__wrap--scrollable {
    position: fixed;
    top: 46px;
    left: 0;
    right: 16px;
    z-index: 2;
  }
  .van-tabs /deep/ .van-tabs__content {
    margin-top: 90px;
  }
}
</style>
