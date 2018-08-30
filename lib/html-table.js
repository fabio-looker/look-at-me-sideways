exports = module.exports = function tableHtml(data, {
		title = "",
		grouping = [], //Array or comma separated string of column names
		sort = [], //Array or omma separated string of column names
		columns = [], //Array or omma separated string of column names 
		filter
	}){
	if(!data || !data.filter || !data.reduce){return ""}
	//Arguments: string split(,) to array, falsey to empty array
	grouping = normalize(grouping)
	sort = normalize(sort)
	columns = normalize(columns)
	//console.log(data.length)
	//console.log(filter.toString())
	//console.log(data.map(filter).filter(unique))
	if(filter){ data = data.filter(filter) }
	if(sort.length){ data = data.sort((a,b)=>sort.reduce((prev,s)=>(prev||(a[s]>b[s]?1:-1)),0))}
	if(grouping.length){
		let dimensionalized = data.reduce((obj,row)=>{
			let key = JSON.stringify(grouping.map(g=>row[g]))
			return {
				...obj,
				[key]:[
					...(obj[key]||[]),
					row
					] 
				}
			},{})
		data = Object.keys(dimensionalized).map(key => ({
				group: JSON.parse(key),
				rows:dimensionalized[key]
			}))
		console.log(data)
		}
	//console.log(data)
	let undefinedGrouping = grouping.reduce((obj,d)=>({...obj,[d]:undefined}),{})
	return (
		(title?"<h2>"+h(title)+"</h2>":"")
		+`
		<table style="border: 1px solid #DDD;padding: 3px 2px;">
		<thead style="font-weight:bold;color:white;background-color:darkblue"><tr>
			`
		+grouping.map(d=>"<th>"+h(d)+"</th>").join("\n\t\t\t")
		+"\n\t\t\t"	
		+(columns.length ? columns.map(d=>"<th>"+h(d)+"</th>").join("\n\t\t\t") : "<th></th>")
		+`
		</tr></thead>
		<tbody>
		`
		+data.map(row => (
			"\n\t\t<tr>"
			+ grouping.map((g,i)=>"\n\t\t\t<td>"+h(row.group?row.group[i]:row[g])+"</td>").join("")
			+ ( columns.length
				? columns.map(col=>"\n\t\t\t<td>"
					+ ( row.rows
						? "<ul>"+row.rows.filter(row=>row[col]).map(row=>"\n\t\t\t\t<li>"+h(row[col])+"</li>").join("")+"</ul>"
						: h(row[col])
						)
					+"\n\t\t\t</td>").join("")
				: "\n\t\t\t<td>"
					+ ( row.rows
						? "<ul>"+rows.map(row=>"<li>"+h(JSON.stringify({...row,...undefinedGrouping}))+"</li>").join("")+"</ul>"
						: h(JSON.stringify({...row,...undefinedGrouping}))
						)
				)
			+"\n\t\t</tr>"
		)).join("")
		+`
		</tbody>
		</table>`+"\n"

		)
	function h(str){return (str||"")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
		}
	function normalize(arg){return (arg.split?arg.split(","):arg||[]).filter(Boolean)}
	function unique(x,i,arr){return arr.indexOf(x)==i}
	}