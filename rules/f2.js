const getExemption = require('../lib/get-exemption.js');

module.exports = function(
	project,
) {
	let messages = [];
	let rule = 'F2';
	let ok = true;
	let files = project.files || [];
	for (let file of files) {
		let views = file.views || [];
		for (let view of views) {
			let fields = []
				.concat(view.dimensions||[])
				.concat(view.measures||[])
				.concat(view.filters||[])
				.concat(view.parameters||[]);
			for (let field of fields) {
				let location = `view:${view._view}/field:${field._dimension||field._measure}`;
				let path = `/projects/${project.name}/files/${file._file_path}#${location}`;
				let exempt = getExemption(field, rule) || getExemption(view, rule) || getExemption(file, rule);
				if ( field.view_label !== undefined) {
					ok = false;
					messages.push({
						location, path, rule, exempt, level: 'warning',
						description: `${location} contains a field-level view_label "${field.view_label}"`,
						hint: 'If specific fields require different view_labels, consider splitting them out into their own field-only view(s) and applying a `label` there',
					});
				}
			}
		}
	}
	if (ok) {
		messages.push({
			rule, level: 'info',
			description: `No field-level view-labels found`,
		});
	}
	return {
		messages,
	};
};
