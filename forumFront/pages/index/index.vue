<template>
	<view class="home">
		<view class="topnav">
			<u-tabs :list="navlist" 
			:activeStyle="{
				color: '#333',
				fontWeight: 'bold',
				transform: 'scale(1.08)'
			}"
			:inactiveStyle="{
				color: '#888',
				transform: 'scale(1)'
			}"
			@click="clickNav"></u-tabs>
		</view>
		
		<view class="loadingState" v-show="loadState">
			<u-skeleton
				rows="4"
				title
				loading				 
			></u-skeleton>
		</view>
		
		<view class="content">
			<view class="item" v-for="item in dataList">
				<blog-item @delEvent="P_delEvent" :item="item" 
				:isLike.sync="item.isLike"
				:like_count.sync="item.like_count"></blog-item>
			</view>
		</view>
		
		<view>
			<uni-load-more :status="uniLoad"></uni-load-more>
		</view>
		
		<view class="edit" @click="goEdit">
			<text class="iconfont icon-a-21-xiugai"></text>
		</view>
	</view>
</template>

<script>
	import {
		store,
		mutations
	} from '@/uni_modules/uni-id-pages/common/store.js'
	const db=uniCloud.database();
	const dbCmd=db.command;
	export default {
		data() {
			return {
				uniLoad:"more",
				noMore:false,
				navlist:[
					{
						name:"最新",
						type:"publish_date"
					},
					{
						name:"热门",
						type:"view_count"
					}
				],
				dataList:[],
				navAction:0,
				loadState:true
			}
		},
		onLoad() {
			this.getData();
		},
		//触底加载更多
		onReachBottom(){
			this.uniLoad='loading'
			if(this.noMore) return this.uniLoad="noMore";			
			this.getData();
		},
		
		methods: {
			P_delEvent(){
				this.dataList=[];				
				this.getData();
			},
			
			//获取网络列表
			async getData(){
				let artTemp= db.collection("quanzi_article").where(`delState != true`).field("title,user_id,description,picurls,comment_count,like_count,view_count,publish_date").getTemp();
				let userTemp=db.collection("uni-id-users").field("_id,username,nickname,avatar_file").getTemp();
				db.collection(artTemp,userTemp).orderBy(this.navlist[this.navAction].type ,"desc")
				.skip(this.dataList.length).limit(5).get()
				.then(async res=>{
					let idArr=[]
					let oldArr=this.dataList;
					if(res.result.data.length==0){
						this.noMore=true						
					}
					
					let resDataArr=[...this.dataList,...res.result.data]
					
					
					if(store.hasLogin){					
						resDataArr.forEach(item=>{
							idArr.push(item._id);
						})
						
						let likeRes=await db.collection("quanzi_like").where({
							article_id:dbCmd.in(idArr),
							user_id:uniCloud.getCurrentUserInfo().uid
						}).get()
						
						likeRes.result.data.forEach(item=>{
							let findIndex=resDataArr.findIndex(find=>{
								return item.article_id == find._id
							})
							resDataArr[findIndex].isLike = true
						})				
					}
					
					
					this.dataList=resDataArr
					this.loadState=false
				})
			},
						
			clickNav(e){	
				this.loadState=true;
				this.dataList=[];
				this.uniLoad="more"
				this.navAction=e.index;
				this.noMore=false
				this.getData();				
			},
			
			//跳转至编辑页面
			goEdit(){
				uni.navigateTo({
					url:"/pages/edit/edit"
				})
			}
			
		}
	}
</script>

<style lang="scss" scoped>
.home{
	.topnav{
		margin-bottom:30rpx;
	}
	.loadingState{
		padding:30rpx;
	}
	.content{
		.item{
			padding:30rpx;
			border-bottom:#F7F7F7 15rpx solid
		}
	}
	.edit{
		width: 120rpx;
		height: 120rpx;
		background: #0199FE;
		border-radius: 50%;
		color:#fff;
		position: fixed;
		z-index: 100;
		bottom:150rpx;
		right: 50rpx;
		display:flex;
		justify-content: center;
		align-items: center;
		box-shadow: 0 0 20rpx rgba(1,153,254,0.8);
		.iconfont{ 
			font-size: 50rpx;
		}
	}
}
</style>
