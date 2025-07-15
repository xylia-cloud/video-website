<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Icon as VanIcon } from 'vant';

const router = useRouter();

// 返回上一页
const goBack = () => {
  router.back();
};
</script>

<template>
  <div class="privacy-policy-page">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="back-button" @click="goBack">
        <van-icon name="arrow-left" size="24" color="#fff" />
      </div>
      <div class="title">隐私政策</div>
      <div class="placeholder"></div>
    </div>

    <div class="content">
      <!-- 隐私政策内容 -->
      <div class="policy-content">
        
        <div class="section">
          <h2 class="section-title">一、引言</h2>
          <p class="section-text">
            我们高度重视用户的隐私保护。本政策详细说明我们如何收集、使用、存储和保护您的个人信息。使用我们的服务即表示您同意本政策的条款。
          </p>
        </div>

        <div class="section">
          <h2 class="section-title">二、信息收集范围</h2>
          
          <h3 class="subsection-title">用户提供的信息</h3>
          <ul class="list">
            <li>注册/登录时收集：用户名、手机号/邮箱、密码（加密存储）</li>
            <li>付费服务时收集：支付信息（由第三方支付平台处理，我们仅记录交易结果）</li>
            <li>用户主动提交的信息：评论、反馈、客服沟通记录</li>
          </ul>

          <h3 class="subsection-title">自动收集的信息</h3>
          <ul class="list">
            <li>设备信息：IP地址、设备型号、操作系统、浏览器类型</li>
            <li>使用数据：观看记录、搜索记录、停留时长、点击行为</li>
            <li>Cookies及类似技术：用于识别用户偏好、维持登录状态</li>
          </ul>

          <h3 class="subsection-title">第三方来源信息</h3>
          <ul class="list">
            <li>通过社交媒体账号登录时获取公开信息（如头像、昵称）</li>
            <li>合作方提供的合法数据（如广告效果统计）</li>
          </ul>
        </div>

        <div class="section">
          <h2 class="section-title">三、信息使用目的</h2>
          <ul class="list">
            <li>提供基础服务（账户管理、视频播放、付费订阅）</li>
            <li>个性化推荐（根据观看习惯推荐内容）</li>
            <li>改进服务质量（分析用户行为优化产品）</li>
            <li>安全保障（检测异常登录、防范欺诈）</li>
            <li>法律合规（配合监管部门合法要求）</li>
          </ul>
        </div>

        <div class="section">
          <h2 class="section-title">四、数据共享与披露</h2>
          <p class="section-text">我们仅在以下情况共享信息：</p>
          <ul class="list">
            <li><strong>必需共享：</strong>与第三方服务提供商（如云存储、CDN、客服系统）</li>
            <li><strong>用户授权：</strong>明确获得用户同意的场景（如参与联合营销活动）</li>
            <li><strong>法律要求：</strong>响应法院传票、政府调查等合法请求</li>
          </ul>
        </div>

        <div class="section">
          <h2 class="section-title">五、用户权利</h2>
          <p class="section-text">您享有以下权利：</p>
          <ul class="list">
            <li><strong>访问与更正：</strong>通过账户设置查看或修改个人信息</li>
            <li><strong>删除权：</strong>联系客服申请删除账户（法律法规要求的留存信息除外）</li>
            <li><strong>撤回同意：</strong>在设备设置中关闭Cookies或位置权限</li>
            <li><strong>投诉举报：</strong>通过 privacy@xxx.com 联系我们</li>
          </ul>
        </div>

        <div class="section">
          <h2 class="section-title">六、数据安全措施</h2>
          <ul class="list">
            <li>采用SSL加密传输数据</li>
            <li>定期进行安全审计</li>
            <li>员工访问权限最小化原则</li>
            <li>建立数据泄露应急响应机制</li>
          </ul>
        </div>

        <div class="section">
          <h2 class="section-title">七、儿童隐私保护</h2>
          <p class="section-text">
            我们不会故意收集13岁以下儿童信息。如发现误收集，将立即删除相关数据。
          </p>
        </div>

        <div class="section">
          <h2 class="section-title">八、政策更新</h2>
          <p class="section-text">
            修改本政策时，我们将在网站显著位置通知。重大变更将获取用户重新同意。
          </p>
        </div>

        <div class="section">
          <h2 class="section-title">联系我们</h2>
          <ul class="list">
            <li>隐私保护负责人邮箱：privacy@xxx.com</li>
            <li>客服电话：400-XXX-XXXX</li>
          </ul>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.privacy-policy-page {
  background-color: #111;
  color: #fff;
  min-height: 100vh;
}

/* 顶部导航栏样式 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #111;
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid #333;
}

.back-button {
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.placeholder {
  width: 24px;
  height: 24px;
}

/* 内容区域 */
.content {
  padding: 0 15px 20px;
}

.policy-content {
  background-color: #222;
  border-radius: 12px;
  padding: 20px;
  margin-top: 15px;
}

/* 章节样式 */
.section {
  margin-bottom: 25px;
}

.section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #ff9500;
  margin-bottom: 12px;
  margin-top: 0;
}

.subsection-title {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  margin: 15px 0 8px 0;
}

.section-text {
  font-size: 15px;
  line-height: 1.6;
  color: #ccc;
  margin-bottom: 12px;
  margin-top: 0;
}

/* 列表样式 */
.list {
  margin: 0;
  padding-left: 20px;
  color: #ccc;
}

.list li {
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 8px;
}

.list li:last-child {
  margin-bottom: 0;
}

.list li strong {
  color: #fff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content {
    padding: 0 10px 20px;
  }
  
  .policy-content {
    padding: 15px;
  }
  
  .section-title {
    font-size: 16px;
  }
  
  .subsection-title {
    font-size: 15px;
  }
  
  .section-text,
  .list li {
    font-size: 14px;
  }
}
</style> 