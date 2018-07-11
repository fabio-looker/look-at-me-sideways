#! /usr/bin/env node
const cliArgs = require('minimist')(process.argv.slice(
		process.argv[0]=="lams"
		?1 //e.g. lams --bla
		:2 //e.g. node index.js --bla
	))
const fs = require("fs")
const path = require("path")
const lookmlParser = require('lookml-parser')
const read = f => fs.readFileSync(f,{encoding:'utf-8'})

!async function(){

try{
		console.log("The judgmental little linter looks sideways at you...")
		console.log(">_>")
		const project = await parser.parseFiles({
				source: cliArgs.input || cliArgs.i,
				console
			})
		var lamsIssues={}
		var summary = {error:[],warning:[]}
		var push = (tgt, type, err) => { tgt[type]=tgt[type]||[]; tgt[type].push(obj); summary[type]=summary[type]||[]; summary[type].push(obj); }

		if(parsed.error){
				push(lamsIssues,"error",parsed.error)
			}
		if(parsed.errors){
				parsed.errors.forEach(w => push(lamsIssues,"warn",w))
			}

		for(m in project.model){if(!project.model.hasOwnProperty(m)){continue} let model = project.model[m];
		for(v in model.view   ){if(   !model.view.hasOwnProperty(v)){continue} let view = model.view[v];

				view.primary_keys = view.dimensions && view.dimensions.filter(d => d._dimension.match(/^[0-9]*pk_/))
				view.warnings=[]
				view.errors=[]

				// K1
				if((view.derived_table || view.sql_table_name) && (!view.primary_keys || !view.primary_keys.length)){
						push(view,"errors",{rule:"K1",message:m+"::"+v+" does not declare any Primary Key Dimensions"})
					}

				//K2
				if(view.primary_keys){
						if(view.primary_keys.length==1){
								if(!view.primary_keys[0]._dimension.match(/^[01]?pk/)){
										push(view,"error",{rule:"K2",message:m+"::"+v+" has 1 Primary Key Dimension ("+view.primary_keys[0]._dimension+"), but the {n} in its name is not '0', '1', or ''"})
									}
							}
						else{
								let misnumberedPks = view.primary_keys.filter(pk => (pk._dimension.match(/^([0-9]+)/)||[])[0] != view.primary_keys.length)
								if(misnumberedPks.length){
										push(view,"error",{rule:"K2",message:m+"::"+v+" has "+view.primary_keys.length+" Primary Key Dimensions, but some of them ("+misnumberedPks.map(pk=>pk._dimension).join(", ")+") have a different {n}"})
									}
							}
					}

				//K3
				if(view.primary_keys){
						let dimsBeforePks = view.dimensions.filter(dim => dim._n < view.primary_keys.length)
						if(dimsBeforePks.length){
								push(view,"error",{rule:"K3",message:m+"::"v+" has "+dimsBeforePks.length+" dimension(s) before the Primary Key Dimensions (e.g., "+dimsBeforePks[0]._dimension+")"})
							}
					}
			}
}catch(e){
	push(lamsIssues,"error",e)
}
var html = (`
	<p style="text-align:center; color: #AAA; font-size: 0.8em">
	Warning: This file is programatically generates. Your changes will be overwritten
	</p>

	<h2>Views</h2>
	<table>
	<thead>
		<tr>
		<th>Model</th>
		<th>View</th>
		<th>File</th>
		<th>Primary Keys</th>
		<th>Warnings</th>
		<th>Errors</th>
		</tr>
	</thead>
	`
	+project.models.map( model => project.views.map( view => `
		<tr>
		<th> ${model} </th>
		<th> ${view} </th>
		<th> ${view._file_name} </th>
		<th><ul>`+view.primary_keys.map(pk=>`
			<li>${pk._dimension}</li>
			`)+`</ul></th>
	`))
	+`
	</tbody>
	</table>
	`)
if(lamsIssues.error){
		console.log("It literally can't even")
		console.log(lamsIssues.error)
		goto report
	}
else if(lamsIssues.warning){
		console.log()
	}
report:
fs.writeFileSync("project-overview.md",html)
console.log("./project-overview.md")
console.log("The End")

}()
