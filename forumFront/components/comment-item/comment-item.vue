<template>
	<view>
		<view class="comment-item" @click="goReply">
			<view class="avatar">
				<u-avatar :src="giveAvatar(item)" size="26"></u-avatar>
			</view>

			<view class="wrap">
				<view class="username">
					{{giveName(item)}}
					<text class="iconfont icon-a-123-cuowu" v-if="!closeBtn" @click.stop="delComment"></text>
				</view>
				<view class="comment-content">{{item.comment_content}}</view>
				<view class="info">
					<view class="reply-btn" v-if="!childState">{{item.totalReply || ''}}回复 </view>
					<view>
						<uni-dateformat :date="item.comment_date" :threshold="[60000,3600000*24*30]">
						</uni-dateformat>
					</view>
					<view>{{item.province}}</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		giveAvatar,
		giveName
	} from '@/utils/tools.js'
	const utilsObj = uniCloud.importObject("utilsObj", {
		customUI: true
	});
	const db = uniCloud.database()
	export default {
		name: "comment-item",
		props: {
			item: {
				type: Object,
				default: () => {
					return {

					}
				}
			},
			childState:{
				type: Boolean,
				default:false
			},
			closeBtn:{
				type: Boolean,
				default:false
			}
		},
		data() {
			return {

			};
		},
		methods: {
			giveAvatar,
			giveName,
			//跳转至回复页面
			goReply() {
				if(this.closeBtn || this.childState){
					return
				}
				// uni.navigateTo({
				// 	url:'/pages/reply/reply?item='+JSON.stringify(this.item)
				// })
				//方法3：
				uni.setStorageSync("replyItem",this.item)
				uni.navigateTo({
					url: '/pages/reply/reply'
				})
				
			},
			delComment() {
				let uid = uniCloud.getCurrentUserInfo().uid
				if (uid == this.item.user_id[0]._id || this.uniIDHasRole('admin') || this.uniIDHasRole('webmaster')) {
					uni.showModal({
						title: "是否确认删除",
						success: res => {
							if (res.confirm) {
								this.removeComment();
							}
						}
					})
				} else {
					uni.showToast({
						title: "权限不够",
						icon: "error"
					})
				}


			},
			removeComment() {
				db.collection("quanzi_comment").doc(this.item._id).remove().then(res => {
					uni.showToast({
						title: "删除成功"
					})
				})
				utilsObj.operation("quanzi_article", "comment_count", this.item.article_id, -1)
				this.$emit("removeEnv", {
					id: this.item._id
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.comment-item {
		display: flex;

		.wrap {
			flex: 1;
			padding-left: 20rpx;
			padding-bottom: 20rpx;

			.username {
				font-size: 26rpx;
				color: #666;
				padding: 10rpx 0;
				display: flex;
				align-items: center;
				justify-content: space-between;
			}

			.iconfont {
				font-size: 30rpx;
				padding: 10rpx;
				color: #999;
			}

			.comment-content {
				font-size: 34rpx;
				color: #111;
				line-height: 1.8em;
			}

			.info {
				font-size: 26rpx;
				color: #666;
				display: flex;
				padding: 10rpx 0;
				align-items: center;

				view {
					margin-right: 25rpx;
				}

				.reply-btn {
					padding: 6rpx 18rpx;
					background: #e4e4e4;
					border-radius: 30rpx;
				}
			}
		}
	}
</style>