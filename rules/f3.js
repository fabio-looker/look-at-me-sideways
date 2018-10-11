module.exports = function(
	project,
) {
	let messages = [];
	let rule = 'F3';
	let ok = true
	let files = project.files || []
	for (let file of files) {
		let views = file.views || [];
		for (let view of views) {
			let fields = view.measures||[];
			for(let field of fields){
				let location = `view:${view._view}/field:${field._dimension||field._measure}`;
				let path = `/projects/${project.name}/files/${file._file_path}#${location}`;
				let exempt = isExempt(file, rule) || isExempt(view, rule) || isExempt(field,rule);
				if ( field.type === "count" && field.filter === undefined){
					ok = false;
					messages.push({
						location, path, rule, exempt, level: 'error',
						description: `Type:count measure at ${location} does not have a filter applied`,
					});
				}
			}
		}
	}
	if(ok){
		messages.push({
			rule, level: 'info',
			description: `No type:count measures without a filter found`
		});
	}
	return {
		messages,
	};
	
	
	function isExempt(obj, rule) {
		return !!(obj.rule_exemptions && obj.rule_exemptions.includes && obj.rule_exemptions.includes(rule));
	}
};