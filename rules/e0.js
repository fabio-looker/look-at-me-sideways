const isExempt = require('../lib/is-exempt.js');

module.exports = function(
	project,
) {
	let messages = [];
	let rule = 'E0';
	let ok = true;
	let files = project.files || [];
	for (let file of files) {
		let models = file.models || [];
		for (let model of models) {
			for (let explore of model.explores) {
				// TODO: Confirm location/path for explores/joins and whether exemptions can happen at join level.
				let location = '';
				let path = '';
				let exempt = false;
				for (let join of explore.joins) {
					// TODO: robustify the below regex to identify liquid in sql_on
					if (/({\s*{)|({\s*%)/.test(join.sql_on)) {
						continue;
					} else {
						let joinFields = (join.sql_on||'').split(/\s+and|=|>=|<=|<|>|or\s+/i).map((x) => x.trim());
						// TODO: change below to be done in one stpe
						let okFields = joinFields.filter((f) => f.match(/\s*\${(\w+.\w+)}\s*/));
						let badFields = joinFields.filter((f) => !okFields.includes(f));
						if (badFields.length) {
							ok = false;
							messages.push({
								location, path, rule, exempt, level: 'warning',
								description: `${badFields.join(', ')} should be referenced using the substitution operator`,
							});
						}
					}
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
