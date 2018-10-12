module.exports = function(
	project,
) {
	let messages = [];
	let rule = 'F4';
	let ok = true
	let files = project.files || []
	for (let file of files) {
		let views = file.views || [];
		for (let view of views) {
			let fields = []
				.concat(view.dimensions||[])
				.concat(view.measures||[])
				.concat(view.filters||[])
				.concat(view.parameters||[]);
			for(let field of fields){
				let location = `view:${view._view}/field:${field._dimension||field._measure}`;
				let path = `/projects/${project.name}/files/${file._file_path}#${location}`;
				let exempt = isExempt(file, rule) || isExempt(view, rule) || isExempt(field,rule);
				if ( !field.hidden && !field.description){
					ok = false;
					messages.push({
						location, path, rule, exempt, level: 'warning',
						description: `${location} is missing a description`,
						hint: "Either apply a description or hide it",
					});
				}
			}
		}
	}
	if(ok){
		messages.push({
			rule, level: 'info',
			description: `No field-level view-labels found`
		});
	}
	return {
		messages,
	};
	
	
	function isExempt(obj, rule) {
		return !!(obj.rule_exemptions && obj.rule_exemptions.includes && obj.rule_exemptions.includes(rule));
	}
};
