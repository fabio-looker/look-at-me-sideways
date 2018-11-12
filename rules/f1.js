/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/fabio-looker/look-at-me-sideways/blob/master/LICENSE.txt */
const getExemption = require('../lib/get-exemption.js');

module.exports = function(
	project,
) {
	let messages = [];
	let rule = 'F1';
	let ok = true;
	let files = project.files || [];
	for (let file of files) {
		let views = file.views || [];
		for (let view of views) {
			if (!view.sql_table_name && !view.derived_table && !view.extends) {
				continue;
			}
			let fields = []
				.concat(view.dimensions||[])
				.concat(view.measures||[])
				.concat(view.filters||[]);
			for (let field of fields) {
				let location = `view:${view._view}/field:${field._dimension||field._measure}`;
				let path = `/projects/${project.name}/files/${file._file_path}#${location}`;
				let exempt = getExemption(field, rule) || getExemption(view, rule) || getExemption(file, rule);
				// TODO: Doublecheck the below matches the actual LookML parameters... I wrote the below without internet connectivity -FB
				[field.sql,
					field.html,
					field.label_from_parameter,
					field.links && field.links.map && field.links.map((o)=>o.url).join(''),
					field.links && field.links.map && field.links.map((o)=>o.url).join(''),
					field.filters && field.filters.map && field.filters.map((o)=>'{{'+o.field+'}}').join(''),
				].forEach((value) => {
					if (!value || !value.match) {
						return;
					}
					let match = value.match(/(^|\$\{|\{\{|\{%)\s*(([^.{}]+)(\.[^.{}]+)+)\s*($|%\}|\})/);
					let parts = ((match||[])[2]||'').split('.').filter(Boolean);
					if (!parts.length) {
						return;
					}
					// Don't treat references to TABLE or to own default alias as cross-view
					if (parts[0] === 'TABLE' || parts[0] === view._view ) {
						parts.shift();
					}
					// Don't treat references to special properties as cross-view
					// Note: view._in_query,_is_filtered,_is_selected should not be allowed in fields
					if ([
						'SQL_TABLE_NAME',
						'_sql',
						'_value',
						'_name',
						'_filters',
						'_parameter_value',
						'_label',
					].includes(parts[parts.length-1])
					) {
						parts.pop();
					}
					if ( parts.length > 1 ) {
						ok = false;
						messages.push({
							location, path, rule, exempt, level: 'error',
							description: `${field._dimension||field._measure} references another view, ${parts[0]},  via ${match[0]}`,
						});
					}
				});
			}
		}
	}
	if (ok) {
		messages.push({
			rule, level: 'info',
			description: `No cross-view references found`,
		});
	}
	return {
		messages,
	};
};
