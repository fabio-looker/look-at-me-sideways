exports = module.exports = function tableHtml(data, {
		title = "",
		grouping = [], //Array or comma separated string of column names
		summaries = [],
		sort = [], //Array or omma separated string of column names
		columns = [], //Array or omma separated string of column names 
		filter
	}){
	if(!data || !data.filter || !data.reduce){return ""}
	//Arguments: string split(,) to array, falsey to empty array
	grouping = normalizeList(grouping)
	sort = normalizeList(sort)
	summaries = normalizeList(summaries)
	columns = normalizeList(columns)
	const finishGrouping = {}
	grouping.push(()=>finishGrouping)
	if(!columns.length){columns = [function details(row){return row==undefined ? "" : html`<pre>${JSON.stringify(row,undefined,2)}</pre>`}]}
	if(!summaries.length){summaries = [function total(total){return (total||0)+1}]}

	if(filter){ data = data.filter(filter) }
	if(sort.length){ data = data.sort((a,b)=>sort.reduce((prev,s)=>(prev||(s(a)>s(b)?1:s(a)<s(b)?-1:0)),0))}
	let rootGroup = {key:title,subgroups:{},summaries:{}} 
	for(d of data){
		let group = rootGroup
		for(g of grouping){
			let key = g(d)
			for(summary of summaries){
				group.summaries[summary.name] = summary(group.summaries[summary.name],d)
				}
			if(key===finishGrouping){break}
			group.subgroups[key] = group.subgroups[key] || {key:key,subgroups:{},summaries:{}}
			group = group.subgroups[key]
			}
		group.data = (group.data||[]).concat(d)
		}
	return renderRecursive(rootGroup)
	function renderRecursive(group,lvl=1){
			return (html`
				<details style='margin-left: ${lvl*2}em' open>
					<summary style="margin-left:-2em;border-bottom:solid 1px #333;">
						<div style="display:inline-flex;width:90%;justify-content:space-between">
						<b>${format(group.key)}</b>`
						+ summaries.map(summary => html`
							<span class="summary">${format(summary.name)}: ${group.summaries[summary.name]}</span>`
							).join("")
						+ html`
					</div></summary>
					`
				+ (group.data ? html`
					<table style="border:solid 1px #ccc">
					<thead style="background-color:darkblue;color:white"><tr>`
					+ columns.map(c => html`
						<th>${format(c.name)}</td>`
					).join("")
					+ html`
					</tr></thead>
					<tbody>`
					+ group.data.map(d => `
						<tr>`
						+ columns.map(c => `
							<td>${c(d)}</td>`
						).join("")
						+ `
						</tr>`
						).join("")
					+ html`
					</tbody>
					</table>
					`
					:'')
				+ Object.values(group.subgroups).map(subgroup => renderRecursive(subgroup,lvl+1)).join("")
				+ html`
				</details>`
			).replace(/\n\t+/g,"\n")
		}

	function html(glue, ...vars){
			return glue.map((g,i)=>g+h(vars[i])).join("")
		}
	function h(str){
		return (""+(str===undefined?"":str))
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
		}
	function format(str){
			str = (""+(str===undefined?"":str))
			if(str.match(/^_?[a-z][a-z0-9]*_[_a-z0-9]+$/)){return str} //Don't touch lookml snake case like things
			return str
				.replace(/^\s*[a-z]/,str=>str.toUpperCase()) //Capitalize first
				.replace(/[a-z][A-Z]/g,str=>str[0]+" "+str[1]) //Camelcase to spaces
		}
	
	function normalizeList(listlike){
		if(!listlike){return []}
		if(listlike.split){listlike = listlike.split(",").map(substr=>substr.trim()).filter(Boolean)}
		if(!listlike.map){return []}
		return listlike.map(field => {
			if(typeof field=="function"){return field}
			if(typeof field=="string"){
				var fn = function(o){return h(o[field])}
				Object.defineProperty(fn, "name", { value: field })
				return fn
				}
			throw "Invalid field type"
			})
		}
	function unique(x,i,arr){return arr.indexOf(x)==i}
	function flatten(a,b){return a.concat(b)}
	}