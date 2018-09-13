exports = module.exports = {
	groupBy:function groupBy({
			title = "",
			grouping = [], //Array or comma separated string of column names
			summaries = {count: total=>(total||0)+1}
		}){
		//Arguments: string split(,) to array, falsey to empty array
		if(grouping.split){grouping = grouping.split(",").map(substr=>substr.trim()).filter(Boolean)}
		grouping = grouping.map(g => typeof g == "function" ? g : x=>x[g] )
		const finishGrouping = {}
		grouping.push(()=>finishGrouping)
		
		return function(accum,datum,d){
			let root = accum || {key:title,subgroups:{},summaries:{}}
			let group = root
			for(g of grouping){
				let key = g(datum)
				for(let [s,summary] of Object.entries(summaries)){
					group.summaries[s] = summary(group.summaries[s],datum)
					}
				if(key===finishGrouping){break}
				group.subgroups[key] = group.subgroups[key] || {key,subgroups:{},summaries:{}}
				group = group.subgroups[key]
				}
			group.data = (group.data||[]).concat(datum)
			return root
			}
		},
	format: function format(str){
		str = (""+(str===undefined?"":str))
		if(str.match(/^_?[a-z][a-z0-9]*_[_a-z0-9]+$/)){return str} //Don't touch lookml snake case like things
		return str
				.replace(/^\s*[a-z]/,str=>str.toUpperCase()) //Capitalize first
				.replace(/[a-z][A-Z]/g,str=>str[0]+" "+str[1]) //Camelcase to spaces
		}
	}