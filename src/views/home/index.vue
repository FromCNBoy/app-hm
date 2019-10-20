<template>
  <div class="home">
    <!-- 导航栏 -->
    <van-nav-bar fixed>
      <van-button
        class="search-btn"
        slot="title"
        round
        type="info"
        size="small"
        @click="$router.push('/search')"
      >搜索</van-button>
    </van-nav-bar>
    <!-- /导航栏 -->

    <!-- 频道列表 -->
    <!-- v-model="active" 用来控制当前激活的频道索引 -->
    <van-tabs v-model="active" animated swipeable>
      <!-- 面包按钮 -->
      <div slot="nav-right" class="wap-nav" @click="isChannelShow = true">
        <van-icon name="wap-nav" size="24" />
      </div>
      <!-- /面包按钮 -->
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
               @click="$router.push('/article/' + article.art_id)"
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
    <!-- 编辑频道 -->
    <van-popup
      v-model="isChannelShow"
      position="bottom"
      :style="{ height: '95%' }"
      round
      closeable
      close-icon="close"
      close-icon-position="top-left"
    >
      <div class="channel-container">
        <van-cell title="我的频道" :border="false">
          <van-button
            type="danger"
            size="mini"
            @click="isEditShow = !isEditShow"
          >{{ isEditShow ? '完成' : '编辑' }}</van-button>
        </van-cell>
        <van-grid :gutter="10">
          <van-grid-item text="推荐" @click="switchChannel(0)" />
          <van-grid-item
            v-for="(channel, index) in channels.slice(1)"
            :key="index"
            :text="channel.name"
            @click="onMyChannelClick(index)"
          >
            <van-icon v-show="isEditShow" class="close-icon" slot="icon" name="close" />
          </van-grid-item>
        </van-grid>
        <van-cell title="推荐频道" :border="false" />
        <van-grid :gutter="10">
          <van-grid-item
            v-for="( channel , index ) in recommondChannels"
            :key="index"
            :text="channel.name "
            @click="onAddChannel(channel)"
          />
        </van-grid>
      </div>
    </van-popup>
    <!-- /编辑频道 -->
  </div>
</template>

<script>
import { getDefaultChannels, getAllChannels } from '@/api/channel'
import { getArticles } from '@/api/article'
import { getItem, setItem } from '@/utils/storage'

export default {
  name: 'HomeIndex',
  data () {
    return {
      active: 0,
      channels: [], // 我的频道列表
      isChannelShow: false, // 频道的显示状态
      allChannels: [], // 所有的频道列表
      isEditShow: false // 频道的编辑状态
    }
  },

  watch: {
    // 函数名就是要监视的数据成员名称
    channels (newVal) {
      setItem('channels', newVal)
    }
  },
  computed: {
    // 获取推荐频道
    recommondChannels () {
      const arr = []
      this.allChannels.forEach(channel => {
        const ret = this.channels.find(item => item.id === channel.id)
        if (!ret) {
          arr.push(channel)
        }
      })
      return arr
    }
  },

  created () {
    // 获取我的频道
    this.loadChannels()
    // 获取所有频道
    this.loadAllChannels()
  },

  methods: {
    // --------- 上拉加载更多 ------------
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

    // ----------下拉刷新 ------------
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
    },

    // --------获取我的频道列表 ----------
    async loadChannels () {
      let channels = []
      // 读取本地存储中的频道列表
      const localChannels = getItem('channels')
      // 如果有本地存储的频道列表就使用本地存储的频道列表
      if (localChannels) {
        channels = localChannels
      } else {
        // 如果没有本地存储的频道列表，则请求获取后台推荐的频道列表
        const { data } = await getDefaultChannels()
        channels = data.data.channels
      }
      // 根据需要扩展自定义数据，用以满足我们的业务需求
      this.extendData(channels)

      this.channels = channels
    },

    // -------- 获取所有频道列表 ------------
    async loadAllChannels () {
      const { data } = await getAllChannels()
      const channels = data.data.channels
      this.extendData(channels)
      this.allChannels = channels
    },

    // --------- 添加频道  --------
    onAddChannel (channel) {
      this.channels.push(channel)
    },

    // ------- 切换频道  ---------

    switchChannel (index) {
      this.active = index
      this.isChannelShow = false
    },

    extendData (channels) {
      channels.forEach(channel => {
        channel.articles = [] // 存储频道的文章列表
        channel.finished = false // 存储频道的加载结束状态
        channel.loading = false // 存储频道的加载更多的 loading 状态
        channel.timestamp = null // 存储获取频道下一页的时间戳
        channel.isPullDownLoading = false // 存储频道的下拉刷新 loading 状态
      })
    },

    // 我的频道项点击处理函数
    onMyChannelClick (index) {
      if (this.isEditShow) {
        // 如果是编辑状态，删除频道
        this.channels.splice(index, 1)
        this.onLoad()
      } else {
        // 如果是非编辑状态，切换频道展示
        // 切换当前激活的频道
        this.switchChannel(index + 1)
      }
    }
  }
}
</script>

<style lang="less" scoped>
.home {
  .article-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .meta span {
      margin-right: 10px;
    }
  }

  .search-btn {
    width: 100%;
    background: #5babfb;
  }
  /** 展示频道的菜单按钮 */
  .wap-nav {
    position: sticky;
    right: 0;
    display: flex;
    align-items: center;
    background-color: #fff;
    opacity: 0.8;
  }

  /* 标签组件的根节点的类名 */
  .van-tabs {
    /deep/ .van-tabs__wrap {
      position: fixed;
      top: 46px;
      z-index: 2;
      left: 0;
      right: 15px;
    }

    /deep/ .van-tabs__content {
      margin-top: 90px;
      margin-bottom: 50px;
    }
  }

  .channel-container {
    padding-top: 30px;
    .close-icon {
      position: absolute;
      top: -5px;
      right: -5px;
    }
  }
}
</style>
