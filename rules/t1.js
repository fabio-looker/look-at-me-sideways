const isExempt = require('../lib/is-exempt');

module.exports = function(
	project,
) {
	let messages = [];
	let rule = 'T1';
	let ok = true;
	let files = project.files || [];

	for (let file of files) {
		let views = file.views || [];
		for (let view of views) {
			let location = 'view: ' + view._view;
			let path = '/projects/'+project.name+'/files/'+file._file_path+'#view:'+view._view;
			if (!view.derived_table) {
				continue;
			}
			if (!(view.derived_table.hasOwnProperty('datagroup_trigger') || view.derived_table.hasOwnProperty('persist_for'))
				&& view.derived_table.hasOwnProperty('sql_trigger_value')) {
				let exempt = isExempt(file, rule) || isExempt(view, rule) || isExempt(view.derived_table, rule);
				ok = false;
				messages.push({
					location, path, rule, exempt, level: 'error',
					description: `Triggered PDTs should use datagroups or persist_for.`,
				});
			}
		}
	}

	if (ok) {
		messages.push({
			rule, level: 'info',
			description: `No outdated derived table persistence constructs found.`,
		});
	}

	return {
		messages,
	};
};
