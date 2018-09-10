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
const htmlTable = require('./lib/html-table.js')

!async function(){

try{	
	console.log("Parsing project...")
	const project = await parser.parseFiles({
			source: cliArgs.input || cliArgs.i,
			console
		})
	if(project.errors){
		console.warn("> Issues occurred during parsing (containing files will not be considered):")
		project.errorReport()
		}
	if(project.error){throw(project.error)}
	project.name = false 
		//|| check for a project manifest file?
		|| cliArgs["project-name"] 
		|| (''+process.cwd()).split(path.sep).filter(Boolean).slice(-1)[0]	//The current directory. May not actually be the project name...
		|| "unknown_project"
		
	console.log("> Parsing done!")
	
	console.log("Checking rules... ")
	var rules = ['k1-2-3-4'] //TODO: This should be dynamic from the folder
	var messages = []
	for( let r of rules){
		console.log("> "+r.toUpperCase())
		let rule = require("./rules/"+r+".js")
		let result = rule(project)
		messages = messages.concat(result.messages.map(msg=>({rule:r, ...msg})))
		}
	console.log("> Rules done!")
	
	console.log("Writing summary files...")
	fs.writeFileSync("index.html",htmlTable(messages,{
		title:"Views by Primary Key",
		filter:msg=>msg.primaryKey!==undefined,
		grouping:["primaryKey"],
		columns:[
			function view(msg){return html`${msg.view} <a href="${msg.path}" style="text-decoration: none">⧉</a>`},
			"primaryKeys",
			"description"]
		}))
	console.log("> Index done")
	fs.writeFileSync("issues.html",htmlTable(messages,{
		title:"Issues",
		filter:msg=>(msg.level=="warn"||msg.level=="error") && !msg.exempt,
		sort:["level","rule"],
		grouping:"rule",
		summaries: [
			function errors(total,row){return (total||0)+(row.level=="error"?1:0)},
			function warnings(total,row){return (total||0)+(row.level=="warning"?1:0)}
			//,function highestLevel(prev,row){return ["error","warning","info"].find(lvl=>(lvl==prev||lvl==row.level)&&lvl)||"none"}
			],
		columns:[
			"level",
			function description(row){return html`${row.description} <a href="${row.path}" style="text-decoration: none">⧉</a>`}
			]
		}))
	console.log("> Issue summary done")
	console.log("> Summary files done!")
	
	/* For CI integration?
	var errors = messages.filter(msg=>msg.level=="error" && !msg.exempt)
	for(e of errors){console.error(e.path,e.rule,e.description)}
	var warnings = messages.filter(msg=>msg.level=="warning" && !msg.exempt)
	for(w of warnings){console.warn(w.path,w.rule,e.description)}
	*/
	}catch(e){
		console.error(e)
		process.exit(1)
	}
}()
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