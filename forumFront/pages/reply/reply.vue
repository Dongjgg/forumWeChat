<template>
	<view class="reply">
		<view class="top">
			<comment-item :closeBtn="true" :item="replyItem"></comment-item>
		</view>
		<view class="list">
			<view class="row" v-for="item in childrenArr">
				<comment-item  @removeEnv="commentEnv" :childState="true" :item="item"></comment-item>
			</view>
		</view>

		<comment-frame @commentEnv="commentEnv" :commentObj="commentObj" :placeholder="`回复：${giveName(this.replyItem)}`"></comment-frame>
	</view>
</template>

<script>
	import {
		giveAvatar,
		giveName
	} from '@/utils/tools.js'
	const db = uniCloud.database()
	export default {
		data() {
			return {
				replyItem: null,
				commentObj: {
					article_id: '',
					comment_type: 1,
					reply_user_id: '',
					reply_comment_id: ''
				},
				childrenArr:[]
			};
		},
		onLoad(e) {
			// this.item = JSON.parse(e.item)
			let item = uni.getStorageSync("replyItem")
			if (!item) return uni.navigateBack();
			this.replyItem = item || {}
			this.commentObj.article_id = this.replyItem.article_id;
			this.commentObj.reply_user_id = this.replyItem.user_id[0]._id;
			this.commentObj.reply_comment_id = this.replyItem._id;
			this.getComment()
		},
		onUnload() {
			//用完销毁
			uni.removeStorageSync("replyItem");
		},
		methods: {
			giveAvatar,
			giveName,
			//评论成功之后的回调
			commentEnv(){
				this.childrenArr = []
				this.getComment()
			},
			//获取子集评论列表
			getComment() {
				let commentTemp = db.collection("quanzi_comment").where(
					`article_id == "${this.replyItem.article_id}" && comment_type == 1 && reply_comment_id == "${this.replyItem._id}"`).orderBy(
					"comment_date desc").limit(10).getTemp();
				let userTemp = db.collection("uni-id-users").field("_id,username,nickname,avatar_file").getTemp()

				db.collection(commentTemp, userTemp).get().then(res => {
					console.log(res);
					this.childrenArr = res.result.data
				})
			}
		}
	}
</script>

<style lang="scss">
	.reply {
		.top {
			padding: 30rpx;
			border-bottom: 15rpx solid #eee;
		}
		.list{
			padding: 30rpx;
			padding-bottom: 120rpx;
			.row{
				padding-bottom: 15rpx;
			}
		}
	}
</style>