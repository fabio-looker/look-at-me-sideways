const getExemption = require('../lib/get-exemption');

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
			let exempt = getExemption(view, rule) || getExemption(file, rule);
			if (!view.derived_table) {
				continue;
			}
			if (!(view.derived_table.hasOwnProperty('datagroup_trigger') || view.derived_table.hasOwnProperty('persist_for'))
				&& view.derived_table.hasOwnProperty('sql_trigger_value')) {
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
			description: `PDT is using datagroups`,
		});
	}

	return {
		messages,
	};
};
