#! /usr/bin/env node
!async function() {
	let messages = []; let lamsErrors = []; let tracker = {};
	try {
		const cliArgs = require('minimist')(process.argv.slice(
			process.argv[0]=='lams'
				? 1 // e.g. lams --bla
				: 2 // e.g. node index.js --bla
		));
		const fs = require('fs');
		const path = require('path');
		const tracker = require('./lib/tracking')({
			cliArgs,
			gaPropertyId: 'UA-96247573-2',
		});
		const parser = require('lookml-parser');
		const dot = require('dot');
		const templateFunctions = require('./lib/template-functions.js');

		dot.templateSettings = {
			...dot.templateSettings,
			evaluate: /\{\{!([\s\S]+?)\}\}/g,
			interpolate: /\{\{=([\s\S]+?)\}\}/g,
			encode: /\{\{&([\s\S]+?)\}\}/g,
			conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
			iterate: /\{\{\*\s*(?:\}\}|([\s\S]+?)\s*:\s*([\w$]+)\s*(?::\s*([\w$]+))?\s*\}\})/g,
			varname: 'ctx',
			strip: false,
		};
		dot.process({path: path.join(__dirname, 'templates')});
		const templates = {
			developer: require('./templates/developer'),
			issues: require('./templates/issues'),
		};
		console.log('Parsing project...');
		const project = await parser.parseFiles({
			source: cliArgs.input || cliArgs.i,
			conditionalCommentString: 'LAMS',
			console,
		});
		if (project.errors) {
			lamsErrors = lamsErrors.concat(project.errors);
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
		let rules = fs.readdirSync(path.join(__dirname, 'rules')).map((fileName) => fileName.match(/^(.*)\.js$/)).filter(Boolean).map((match) => match[1]);
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
		if (tracker.enabled) {
			await tracker.track({messages, errors: lamsErrors});
		}
		if (errors.length) {
			process.exit(1);
		} else {
			process.exit(0);
		}
	} catch (e) {
		try {
			console.error(e);
			if (!tracker.valid) {
				throw new Error('Unknown error');
			}
			if (tracker.enabled) {
				e.isFatalError = true;
				tracker.track({messages, errors: lamsErrors.concat(e)});
			} else {
				console.warn(`Error reporting is disabled. Run with --reporting=yes to report, or see PRIVACY.md for more info`);
			}
		} catch (e) {
			console.error(e);
			console.error(`Error reporting is not available	. Please submit an issue to https://github.com/fabio-looker/look-at-me-sideways/issues`);
		}
		process.exit(1);
	}
}();
