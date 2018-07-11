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

let errors = []
let warnings = []
try{
		console.log("The judgmental little linter looks sideways at you...")
		console.log(">_>")
		const project = await parser.parseFiles({
				source: cliArgs.input || cliArgs.i,
				console
			})
		if(parsed.errors){console.warn(...parse.errors)}

		//K1 & K2
		missingPks = project.views.filter(v => !v.dimensions.some(d => d._dimension.match(/^[0-9]*pk_/)))
		console.log("Missing PKs:",missingPks)

		misnumberedPks = project.views.filter(v => {
				let pks = v.dimensions.filter(d => d._dimension.match(/^[0-9]*pk_/))
				if(pks.length==1){
					if(!pks[0].match(/^[01]?pk/)){return true}
					return false
				}
				return = pks.every(pk => (pk._dimension.match(/^([0-9]*)/)[0]||"1") == xpks.length)
			})
		console.log("Misnumbered PKs:",missingPks)
}catch(e){

}
console.log("The End")
