/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/fabio-looker/look-at-me-sideways/blob/master/LICENSE.txt */
const getExemption = require('../lib/get-exemption.js');

module.exports = function(
	project,
) {
	let messages = [];
	let rule = 'E1';
	let ok = true;
	let models = project.models || [];
	for (let model of models) {
		let explores = model.explores || [];
		for (let explore of explores) {
			let path = `/projects/${project.name}/files/${model._model}.model.lkml`;
			let joins = explore.joins || [];
			for (let join of joins) {
				let location = `model:${model._model}/explore:${explore._explore}/join:${join._join}`;
				let exempt = getExemption(join, rule) || getExemption(explore, rule) || getExemption(model, rule);
				let sql = join.sql || join.sql_on || '';
				let sqlWithLkmlRemoved = sql.replace(/\${[\s\S]*?}|{{[\s\S]*?}}|{%\s*if[\s\S]*?endif\s*%}|{%[\s\S]*?%}/g, '' );
				let references = (sqlWithLkmlRemoved.match(/[a-zA-Z0-9._]+\.[a-zA-Z0-9 ._]+/g)||[])
					.filter((ref) => !( // Two-part references to allow
						ref.match(/^safe\./i) // BigQuery: https://cloud.google.com/bigquery/docs/reference/standard-sql/functions-and-operators#safe-prefix
					));
				if (references.length) {
					ok = false;
					messages.push({
						location, path, rule, exempt, level: 'warning',
						description:
							references.slice(0, 3).join(', ')
							+ (references.length>3?'...':'')
							+ ` should be referenced using the substitution operator`,
					});
				}
			}
		}
	}
	if (ok) {
		messages.push({
			rule, level: 'info',
			description: 'All join fields are referenced using the substitution operator',
		});
	}
	return {
		messages,
	};
};
