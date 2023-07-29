const db=uniCloud.database();
const dbCmd=db.command;
module.exports = {
	_before: function () { // 通用预处理器

	},
	/**
	 * 自定义增减
	 * @param {Object} table  数据表
	 * @param {Object} attr   属性
	 * @param {Object} id  
	 * @param {Object} num    1自增  -1自减
	 */
	async operation(table,attr,id,num){
		let obj={}
		obj[attr]=dbCmd.inc(num);
		return await db.collection(table).doc(id).update(obj)
	}
}
