#! /usr/bin/env node
const cliArgs = require('minimist')(process.argv.slice(
		process.argv[0]=="lams"
		?1 //e.g. lams --bla
		:2 //e.g. node index.js --bla
	))
const fs = require("fs")
const path = require("path")
const parser = require('lookml-parser')
const read = f => fs.readFileSync(f,{encoding:'utf-8'})

!async function(){

try{
		
		const project = await parser.parseFiles({
				source: cliArgs.input || cliArgs.i,
				console
			})
		if(project.error){
				console.error(project.error)
			}
		if(project.errors){
				//project.errors.forEach(w => console.warn(w))
				console.warn(project.errorReport())
			}
		
		const views = project.files.filter(f=>f._file_type=="view").map(m=>m.views).filter(Boolean).reduce(flatten,[])
		const modelViews = project.models.map(m=>m.views).filter(Boolean).reduce(flatten,[])
		console.log(modelViews.map(mv=>mv._view))
		for( view of views){
				view.info={}
				{ // info.pk
					let pkNamingConvention = d=>d._dimension.match(/^([0-9]+pk_|pk[0-9]+_)([a-z0-9A-Z_]+)$/)
					if(view.dimensions.some(pkNamingConvention)){
						view.info.pks = view.dimensions
								.map(pkNamingConvention)
								.filter(Boolean)
								.map(match => match[2])
					} else if(view.dimensions.some(d=>d.primary_key)){
							let pkDims=view.dimensions.filter(d=>d.primary_key)
							if(pkDims.length>1) {
									view.info.pks = ["Multiple primary_key error"]
							}else
							if(pkDims[0].sql && !pkDims[0].sql.match(/^\s*(\$\{TABLE\}\.[._a-zA-Z0-9]+|\$\{[._a-zA-Z0-9]\})\s*$/)) {
									view.info.pks = ["Complex `primary_key`s not supported"]
							}else{
									view.info.pks = [pkDims[0]._dimension]
							}
					} else {
						view.info.pks = ["Ø"]
					}
				}
				{ 
					let containsCrossViewCriteria = d=>d.sql && d.sql.match(/\$\{[^}]+\.[^}]+\}/)
					let crossViewMessage = f => f+" contains cross-view references"
					view.info.warnings=[]
					.concat((view.dimensions||[]).filter(containsCrossViewCriteria).map(f=>crossViewMessage(f._dimension)))
					.concat((view.measures||[]).filter(containsCrossViewCriteria).map(f=>crossViewMessage(f._measure)))
						
				}
			}	


			var html = (`
				<p style="text-align:center; color: #AAA; font-size: 0.8em">
				Warning: This file is programatically generated. Your changes will be overwritten
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
				+views.map(view => `
					<tr>
					<td> todo </td>
					<td> ${view._view} </td>
					<td> todo </td>
					<td><ul>`+view.info.pks.map(pk=>`
						<li>${pk}</li>
						`).join('\n')+`</ul></td>
					<td>`+(view.info.warnings.length
						?	`<details><summary>${view.info.warnings.length} warning(s)</summary>
							<ul>`+view.info.warnings.map(warn=>`
								<li>${warn}</li>
								`).join('\n')+`</ul>`
						:	''
					)
					+`</td>
					<td>todo</td>
				`).join("\n")
				+`
				</tbody>
				</table>
				`)
			fs.writeFileSync("project-overview.html",html)
			console.log("./project-overview.md")
			
}catch(e){
	console.error(e)
	process.exit(1)
}
/* Nevermind this
  PK: Account_id
	Views:
	Model		View				Other PK's		Other Dims
	meta		account								segment,region,MRR,...
	meta		account_facts						next_renewal_date,
	meta		account_team		
	meta		cs_health_calendar	date			score
	
  Pk: Date
  	Views:
	Model		View				Other PK's		Other Dims
	pinger		date_rollup			user_id			run_queries, explores, ...
	meta		cs_health_calendar	account_id		score
*/


// if(lamsIssues.error){
// 		console.log("It literally can't even")
// 		console.log(lamsIssues.error)
// 		goto report
// 	}
// else if(lamsIssues.warning){
// 		console.log()
// 	}
// report:
// fs.writeFileSync("project-overview.md",html)
// console.log("./project-overview.md")
// console.log("The End")

}()


function flatten(a,b){return a.concat(b)}