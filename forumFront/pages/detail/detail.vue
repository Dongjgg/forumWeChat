<template>
	<view class="detail">
		<view class="container">


			<view v-if="loadState">
				<u-skeleton rows="5" title loading></u-skeleton>
			</view>
			<view v-else>
				<view class="title">{{detailObj.title}}</view>
				<view class="userinfo">
					<view class="avatar">
						<image :src="giveAvatar(detailObj)" mode="aspectFill"></image>
					</view>
					<view class="text">
						<view class="name">
							{{giveName(detailObj)}}
						</view>
						<view class="small">
							<uni-dateformat :date="detailObj.publish_date"
								format="yyyy年MM月dd hh:mm:ss"></uni-dateformat> · 发布于{{detailObj.province}}
						</view>
					</view>
				</view>
				<view class="content">
					<u-parse :content="detailObj.content" :tagStyle="tagStyle"></u-parse>
				</view>


				<view class="like">
					<view class="btn" :class="detailObj.isLike ? 'active' : ''" @click="clickLike">
						<text class="iconfont icon-good-fill"></text>
						<text v-if="detailObj.like_count">{{detailObj.like_count}}</text>
					</view>
					<view class="users">
						<template v-for="item in likeUserArr">
							<image :src="giveAvatar(item)" mode="aspectFill"></image>
						</template>
					</view>
					<view class="text"><text class="num">{{detailObj.view_count}}</text>人看过</view>
				</view>

			</view>
		</view>

		<view class="comment" >
			<view v-if="!CommentList.length">
				<u-empty mode="comment" icon="https://cdn.uviewui.com/uview/empty/comment.png">
				</u-empty>
			</view>

			<view class="content" v-if="CommentList.length">
				<view class="item" v-for="item in CommentList">
					<comment-item :item="item" @removeEnv="PremoveEnv"></comment-item>
				</view>
			</view>

		</view>

		<comment-frame :commentObj="commentObj" @commentEnv="commentEnv"></comment-frame>
	</view>
</template>

<script>
	import pageJson from "@/pages.json"

	import {
		giveName,
		giveAvatar,
		likeFun
	} from "../../utils/tools.js"
	import {
		store
	} from '@/uni_modules/uni-id-pages/common/store.js'
	const db = uniCloud.database();
	const utilsObj = uniCloud.importObject("utilsObj", {
		customUI: true
	});
	export default {
		data() {
			return {
				artid: "",
				loadState: true,
				tagStyle: {
					p: "line-height:1.7em;font-size:16px;padding-bottom:10rpx",
					img: "margin:10rpx 0"
				},
				detailObj: null,
				likeUserArr: [],
				commentObj: {
					article_id: '',
					comment_type: 0
				},
				CommentList: []
			};
		},

		onLoad(e) {
			if (!e.id) {
				this.errFun();
				return;
			}
			this.artid = e.id;
			this.commentObj.article_id = e.id
			this.getData();
			this.readUpdate();
			this.getLikeUser();
			this.getComment()
		},
		methods: {
			giveName,
			giveAvatar,
			//删除评论后的回调
			PremoveEnv(e){
				console.log(e);
				let index = this.CommentList.findIndex(item => {
					return item._id == e.id
				})
				this.CommentList.splice(index,1)
			},
			//评论成功后的回调
			commentEnv(e){
				console.log(e);
				this.CommentList.unshift({
					...this.commentObj,
					...e,
					user_id:[store.userInfo]
				})
			},
			//获取评论列表
			async getComment() {
				let commentTemp = db.collection("quanzi_comment").where(`article_id == "${this.artid}" && comment_type == 0`).orderBy(
					"comment_date desc").limit(5).getTemp();
				let userTemp = db.collection("uni-id-users").field("_id,username,nickname,avatar_file").getTemp()

				let res = await db.collection(commentTemp,userTemp).get()
				
				let idArr = res.result.data.map(item => {
					return item._id
				})
				
				let replyArr = await db.collection("quanzi_comment").where({
					reply_comment_id:db.command.in(idArr)
				}).groupBy('reply_comment_id').groupField('count(*) as totalReply').get();
			
				res.result.data.forEach(item => {
					let index = replyArr.result.data.findIndex(find =>{
						return find.reply_comment_id == item._id
					})
					if(index>-1){
						item.totalReply = replyArr.result.data[index].totalReply
					}
				})
			
				this.CommentList = res.result.data
			},
			//获取部分点赞的用户
			getLikeUser() {
				let likeTemp = db.collection("quanzi_like").where(`article_id == "${this.artid}"`).getTemp()
				let userTemp = db.collection("uni-id-users").field("_id,avatar_file").getTemp()
				db.collection(likeTemp, userTemp).orderBy("publish_date desc").limit(5).get().then(res => {
					console.log(res);
					res.result.data = res.result.data.reverse()
					this.likeUserArr = res.result.data
				})
			},

			//点赞操作
			async clickLike() {
				if (!store.hasLogin) {
					uni.showModal({
						title: "登录后才可进行后续操作",
						success: res => {
							if (res.confirm) {
								uni.navigateTo({
									url: "/" + pageJson.uniIdRouter.loginPage
								})
							}
						}
					})
					return;
				}

				let time = Date.now();
				if (time - this.likeTime < 2000) {
					uni.showToast({
						title: "操作太频繁，请稍后...",
						icon: "none"
					})
					return;
				}
				this.detailObj.isLike ? this.detailObj.like_count-- : this.detailObj.like_count++;
				this.detailObj.isLike = !this.detailObj.isLike
				this.likeTime = time;
				//调用点赞方法
				likeFun(this.artid);

			},




			//修改阅读量
			readUpdate() {
				utilsObj.operation("quanzi_article", "view_count", this.artid, 1).then(res => {
					console.log(res);
				})
			},


			//错误的处理
			errFun() {
				uni.showToast({
					title: "参数有误",
					icon: "none"
				})
				setTimeout(() => {
					uni.reLaunch({
						url: "/pages/index/index"
					})
				}, 1000)
			},

			//获取数据库数据
			getData() {
				let artTemp = db.collection("quanzi_article").where(`_id=="${this.artid}"`).getTemp();
				let userTemp = db.collection("uni-id-users").field("_id,username,nickname,avatar_file").getTemp();
				let likeTemp = db.collection("quanzi_like").where(`article_id=="${this.artid}" && user_id==$cloudEnv_uid`)
					.getTemp();

				let tempArr = [artTemp, userTemp];
				if (store.hasLogin) tempArr.push(likeTemp)


				db.collection(...tempArr).get({
					getOne: true
				}).then(res => {
					console.log(res);
					if (!res.result.data) {
						this.errFun();
						return;
					}
					this.loadState = false;
					let isLike = false;
					if (store.hasLogin) isLike = res.result.data._id.quanzi_like.length ? true : false;
					res.result.data.isLike = isLike;
					this.detailObj = res.result.data
					uni.setNavigationBarTitle({
						title: this.detailObj.title
					})
				}).catch(err => {
					this.errFun();
				})
			}
		}
	}
</script>

<style lang="scss">
	.detail {
		background: #f8f8f8;
		min-height: calc(100vh - var(--window-top));

		.container {
			padding: 30rpx;
			background: #fff;

			.title {
				font-size: 46rpx;
				color: #333;
				line-height: 1.4em;
				font-weight: 600;
			}

			.userinfo {
				padding: 20rpx 0 50rpx;
				display: flex;
				align-items: center;

				.avatar {
					width: 60rpx;
					height: 60rpx;
					padding-right: 15rpx;

					image {
						width: 100%;
						height: 100%;
						border-radius: 50%;
					}
				}

				.text {
					font-size: 28rpx;
					color: #555;

					.small {
						font-size: 20rpx;
						color: #999;
					}
				}
			}

			.content {}

			.like {
				display: flex;
				flex-direction: column;
				align-items: center;
				padding: 80rpx 50rpx 50rpx;

				.btn {
					width: 260rpx;
					height: 120rpx;
					background: #e4e4e4;
					border-radius: 100rpx;
					color: #fff;
					display: flex;
					justify-content: center;
					align-items: center;
					flex-direction: column;
					font-size: 28rpx;

					.iconfont {
						font-size: 50rpx;
					}

					&.active {
						background: #0199FE;
					}
				}

				.text {
					font-size: 26rpx;
					color: #666;

					.num {
						color: #0199FE
					}

					.spot {
						padding: 0 10rpx;
					}
				}

				.users {
					display: flex;
					justify-content: center;
					padding: 30rpx 0;

					image {
						width: 50rpx;
						height: 50rpx;
						border-radius: 50%;
						border: 3px solid #fff;
						margin-left: -20rpx;
					}
				}
			}

		}
	}


	.comment {
		padding: 30rpx;
		padding-bottom: 120rpx;

		.item {
			padding: 10rpx 0;
		}
	}
</style>