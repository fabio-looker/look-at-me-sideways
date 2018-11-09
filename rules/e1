const getExemption = require('../lib/get-exemption.js');

module.exports = function(
	project,
) {
	let messages = [];
	let rule = 'E1';
	let ok = true;
	for (let model of project.models) {
		for (let explore of model.explores) {
			// TODO: Confirm location/path for explores/joins
			let location = `model:${model._model}/explore:${explore._explore}`;
			let path = `/projects/${project.name}/files/${model._model}.model.lkml`;
			for (let join of explore.joins) {
				let exempt = getExemption(join, rule) || getExemption(explore, rule) || getExemption(model, rule);
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
