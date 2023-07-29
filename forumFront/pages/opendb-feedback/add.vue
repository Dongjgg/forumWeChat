<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validate-trigger="submit" err-show-type="toast">
      <uni-forms-item name="content" label="留言内容/回复内容" required>
        <textarea @input="binddata('content', $event.detail.value)" class="uni-textarea-border" v-model="formData.content" trim="right"></textarea>
      </uni-forms-item>
      <uni-forms-item name="imgs" label="图片列表">
        <uni-file-picker file-mediatype="image" :limit="6" return-type="array" v-model="formData.imgs"></uni-file-picker>
      </uni-forms-item>
      <uni-forms-item name="is_reply" label="是否是回复类型">
        <switch @change="binddata('is_reply', $event.detail.value)" :checked="formData.is_reply"></switch>
      </uni-forms-item>
      <uni-forms-item name="feedback_id" label="被回复留言ID">
        <uni-easyinput v-model="formData.feedback_id"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="contact" label="联系人" required>
        <uni-easyinput v-model="formData.contact" trim="both"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="mobile" label="联系电话">
        <uni-easyinput v-model="formData.mobile" trim="both"></uni-easyinput>
      </uni-forms-item>
      <view class="uni-button-group">
        <button type="primary" class="uni-button" @click="submit">提交</button>
      </view>
    </uni-forms>
  </view>
</template>

<script>
  import { validator } from '../../js_sdk/validator/opendb-feedback.js';

  const db = uniCloud.database();
  const dbCollectionName = 'opendb-feedback';

  function getValidator(fields) {
    let result = {}
    for (let key in validator) {
      if (fields.indexOf(key) > -1) {
        result[key] = validator[key]
      }
    }
    return result
  }

  

  export default {
    data() {
      let formData = {
        "content": "",
        "imgs": [],
        "is_reply": null,
        "feedback_id": "",
        "contact": "",
        "mobile": ""
      }
      return {
        formData,
        formOptions: {},
        rules: {
          ...getValidator(Object.keys(formData))
        }
      }
    },
    onReady() {
      this.$refs.form.setRules(this.rules)
    },
    methods: {
      
      /**
       * 验证表单并提交
       */
      submit() {
        uni.showLoading({
          mask: true
        })
        this.$refs.form.validate().then((res) => {
          return this.submitForm(res)
        }).catch(() => {
        }).finally(() => {
          uni.hideLoading()
        })
      },

      /**
       * 提交表单
       */
      submitForm(value) {
        // 使用 clientDB 提交数据
        return db.collection(dbCollectionName).add(value).then((res) => {
          uni.showToast({
            icon: 'none',
            title: '新增成功'
          })
          this.getOpenerEventChannel().emit('refreshData')
          setTimeout(() => uni.navigateBack(), 500)
        }).catch((err) => {
          uni.showModal({
            content: err.message || '请求服务失败',
            showCancel: false
          })
        })
      }
    }
  }
</script>

<style>
  .uni-container {
    padding: 15px;
  }

  .uni-input-border,
  .uni-textarea-border {
    width: 100%;
    font-size: 14px;
    color: #666;
    border: 1px #e5e5e5 solid;
    border-radius: 5px;
    box-sizing: border-box;
  }

  .uni-input-border {
    padding: 0 10px;
    height: 35px;

  }

  .uni-textarea-border {
    padding: 10px;
    height: 80px;
  }

  .uni-button-group {
    margin-top: 50px;
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    justify-content: center;
  }

  .uni-button {
    width: 184px;
  }
</style>
