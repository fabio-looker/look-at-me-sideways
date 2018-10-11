#! /usr/bin/env node
const cliArgs = require('minimist')(process.argv.slice(
	process.argv[0]=='lams'
		? 1 // e.g. lams --bla
		: 2 // e.g. node index.js --bla
));
const fs = require('fs');
const path = require('path');
const parser = require('lookml-parser');
const dot = require('dot');
const templateFunctions = require('./lib/template-functions.js');

dot.templateSettings = {
	...dot.templateSettings,
	evaluate: /\{\{!([\s\S]+?)\}\}/g,
	interpolate: /\{\{=([\s\S]+?)\}\}/g,
	encode: /\{\{&([\s\S]+?)\}\}/g,
	conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
	iterate: /\{\{\*\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
	varname: 'ctx',
	strip: false,
};
dot.process({path: path.join(__dirname, 'templates')});
const templates = {
	developer: require('./templates/developer'),
	issues: require('./templates/issues'),
};

!async function() {
	try {
		console.log('Parsing project...');
		const project = await parser.parseFiles({
			source: cliArgs.input || cliArgs.i,
			console,
		});
		if (project.errors) {
			console.warn('> Issues occurred during parsing (containing files will not be considered):');
			project.errorReport();
		}
		if (project.error) {
			throw (project.error);
		}
		project.name = false
		// || check for a project manifest file?
		|| cliArgs['project-name']
		|| (''+process.cwd()).split(path.sep).filter(Boolean).slice(-1)[0]	// The current directory. May not actually be the project name...
		|| 'unknown_project';

		console.log('> Parsing done!');

		console.log('Checking rules... ');
		let rules = ['k1-2-3-4','f1','f2','f3']; // TODO: This should be dynamic from the folder
		let messages = [];
		for (let r of rules) {
			console.log('> '+r.toUpperCase());
			let rule = require('./rules/'+r+'.js');
			let result = rule(project);
			messages = messages.concat(result.messages.map((msg)=>({rule: r, ...msg})));
		}
		console.log('> Rules done!');

		console.log('Writing summary files...');
		fs.writeFileSync('developer.md', templates.developer({messages, fns: templateFunctions}).replace(/\n\t+/g, '\n'));
		console.log('> Developer index done');
		fs.writeFileSync('issues.md', templates.issues({messages, fns: templateFunctions}).replace(/\n\t+/g, '\n'));
		console.log('> Issue summary done');

		console.log('> Summary files done!');

		/* For CI integration?
		var errors = messages.filter(msg=>msg.level=="error" && !msg.exempt)
		for(e of errors){console.error(e.path,e.rule,e.description)}
		var warnings = messages.filter(msg=>msg.level=="warning" && !msg.exempt)
		for(w of warnings){console.warn(w.path,w.rule,e.description)}
		*/
		let errors = messages.filter((msg) => {
			return msg.level==='error' && !msg.exempt;
		});
		let warnings = messages.filter((msg) => {
			return msg.level==='warning' && !msg.exempt;
		});

		const buildStatus = errors.length ? 'FAILED' : 'PASSED';
		console.log(`BUILD ${buildStatus}: ${errors.length} errors and ${warnings.length} warnings found. Check .md files for details.`);

		if (errors.length) {
			process.exit(1);
		} else {
			process.exit(0);
		}
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
}();
