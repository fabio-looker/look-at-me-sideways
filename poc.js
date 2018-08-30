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
	if(project.error){throw(project.error)}
	if(project.errors){
		console.warn("> Issues occurred during parsing (containing files will not be considered):")
		project.errorReport()
		}
	console.log("> Parsing done!")
	
	console.log("Checking rules... ")
	var rules = ['k1-2'] //TODO: This should be dynamic from the folder
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
		title:"Views",
		filter:msg=>msg.primary_keys!==undefined,
		grouping:["primary_keys"],
		columns:["path","description"]
		}))
	console.log("> View index done")
	fs.writeFileSync("issues.html",htmlTable(messages,{
		title:"Issues",
		filter:msg=>(msg.level=="warn"||msg.level=="error") && !msg.exempt,
		columns:["level","rule","description","path"],
		sort:["level","rule"]
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
