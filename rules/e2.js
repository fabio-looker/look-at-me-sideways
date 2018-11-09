const getExemption = require('../lib/get-exemption.js');

module.exports = function(
	project,
) {
	let messages = [];
	let rule = 'E2';
	let ok = true;
	let models = project.models || [];
	const pkNamingConvention = (d)=>d._dimension.match(/^([0-9]+pk|pk[0-9]+)_([a-z0-9A-Z_]+)$/);
	for (let model of models) {
		let explores = model.explores || [];
		for (let explore of explores) {
			let path = `/projects/${project.name}/files/${model._model}.model.lkml`;
			let join = explore.joins || [];
			for (let join of joins) {
				let location = `model:${model._model}/explore:${explore._explore}/join:${join._join}`;
				let exempt = getExemption(join, rule) || getExemption(explore, rule) || getExemption(model, rule);
				let joinSql = join.sql || join.sql_on;
				let allRefs = (joinSql.match(/(?<=\${).*?(?=})/g)||[])
				let reducedSql = joinSql;
				if(reducedSql.test(/\([\s\S]*?(?<!\\)\)/)) {
					messages.push({
						path,location,rule,level:"info",
						description:"Equality constraints are only checked in the top-level of the ON clause (not within parentheses)",
					});
					while(reducedSql.test(/\([\s\S]*?(?<!\\)\)/)) {
						reducedSql = reducedSql.replace(/\([\s\S]*?(?<!\\)\)/g,"");
					}
				}
				if(reducedSql.test(/\bOR\b/i)){
					messages.push({
						path,location,rule,exempt,level:"warning",
						description:"Compound equality constraints are only established by AND'ed equality expressions. OR is not allowed.",
					});
				}
				let constrainedRefs = (reducedSql.match(/(?<=[^><]=\s*\${).*?(?=})}|(?<=\${).*?(?=}\s*=)/g)||[])
				let [otherCardinality,ownCardinality] = (join.relationship || "many_to_one").split("_to_");
				let oneAliases = [];
				if(ownCardinality === "one"){
					oneAliases.push(join._join)
				}
				if(otherCardinality === "one"){
					let otherAliases = 
						allRefs
						.filter((ref) => !ref.match(/^TABLE$|^SUPER$|^EXTENDED$|\.SQL_TABLE_NAME$/))
						.map(ref => ref.split('.')[0])
						.filter(alias => alias != join._join)
					for(otherAlias of otherAliases) {
						if(!oneAliases.includes(otherAlias)){
							oneAliases.push(otherAlias)
						}
					}
				}
				let refsMissingConstraints = [];
				for(alias of oneAliases) {
					let view = getView(alias,explore,model);
					if(!view){
						continue;
					}
					let pkDimensions = (view.dimensions||[]).filter(pkNamingConvention);
					if (pkDimensions.every((d) => d._dimension.match(/^(pk0|0pk)/))) {
						// Skip enforcement for views with no PKs or 0 PKs
						continue;
					}
					for(let {_dimension} of pkDimensions){
						let requiredRef = alias+'.'+_dimension;
						if(!constrainedRefs.includes(requiredRef)){
							refsMissingConstraints.push(requiredRef);
						}
					}
				}
				if(refsMissingConstraints.length){
					ok = false;
					messages.push({
						location, path, rule, exempt, level: 'warning',
						description: 
							refsMissingConstraints.slice(0,3).join(', ')
							+ (refsMissingConstraints.length>3?"...":'')
							+ ` should be part of an equality constraint in ${join._join} join`,
					});
				}
			}
		}
	}
	if (ok) {
		messages.push({
			rule, level: 'info',
			description: 'All primary keys from `one` cardinality views apply equality constraints to all primary keys',
		});
	}
	return {
		messages,
	};
	
	/** Gets a view object from the given model, by the given alias within the given explore
	 * @param {string} alias The alias that refers to a join or base_view
	 * @param {object} explore The explore in which the alias is resolved
	 * @param {object} mode The model in which the view is defined
	 * @return {object} The referenced view
	 */
	function getView(alias, explore, model){
		if(alias == explore.view_name || explore._explore){
			return model.view[explore.from || explore._explore];
		}
		if(explore.join && explore.join[alias]){
			let join = explore.join[alias]
			return model.view[join.from || join._join];
		}
	}
};
