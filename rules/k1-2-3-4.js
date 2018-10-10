module.exports = function(
	project
	// outputs from other rules?
) {
	let messages = [];
	const views = project.files.map((m)=>m.views).filter(Boolean).reduce(flatten, []);
	const pkNamingConvention = (d)=>d._dimension.match(/^([0-9]+pk|pk[0-9]+)_([a-z0-9A-Z_]+)$/);
	for (let file of project.files) {
		let views = file.views || [];
		for (let view of views) {
			let location = 'view: '+view._view;
			let path = '/projects/'+project.name+'/files/'+file._file_path+'#view:'+view._view;
			let pkDimensions = (view.dimensions||[]).filter(pkNamingConvention);
			if (!pkDimensions.length) {
				let rule = 'K1';
				let exempt = isExempt(file, rule) || isExempt(view, rule);
				messages.push({
					location, path, rule, exempt, level: 'error',
					description: 'No Primary Key Dimensions found in '+view._view,
				});
				continue;
			}
			let declaredNs = pkDimensions.map(pkNamingConvention).map((match)=>match[1].replace('pk', '')).filter(unique);
			if (declaredNs.length>1) {
				let rule = 'K2';
				let exempt = isExempt(file, rule) || isExempt(view, rule);
				messages.push({
					location, path, rule, exempt, level: 'error',
					description: 'Different Primary Key Dimensions in '+view._view+' declare different column counts: '+declaredNs.join(', '),
				});
				continue;
			}
			if (pkDimensions.length != parseInt(declaredNs[0])) {
				let rule = 'K2';
				let exempt = isExempt(file, rule) || isExempt(view, rule);
				messages.push({
					location,
					path,
					rule,
					exempt,
					level: 'error',
					description: `View ${view._view} has ${pkDimensions.length} Primary Key Dimension(s) but their names declare ${declaredNs[0]} columns`,
				});
				continue;
			}
			if (!pkDimensions.reduce(((min, x)=>x._n<min?x._n:min), 99) !== 0 &&
				!pkDimensions.reduce(((max, x)=>x._n>max?x._n:max), 0) !== pkDimensions.length ) {
				let rule = 'K3';
				let exempt = isExempt(file, rule) || isExempt(view, rule);
				messages.push({
					location,
					path,
					rule,
					exempt,
					level: 'warning',
					description: `Primary Key Dimensions in ${view._view} are not declared before other dimensions`,
				});
			}
			if (pkDimensions.some((dim)=>!dim.hidden)) {
				let dims = pkDimensions.filter((dim)=>!dim.hidden);
				let rule = 'K4';
				let exempt = isExempt(file, rule) || isExempt(view, rule) || dims.every((d)=>isExempt(d, rule));
				let dimNames = dims.map((dim)=>dim._dimension).join(', ');
				messages.push({
					location,
					path,
					rule,
					exempt,
					level: 'warning',
					description: `Primary Key Dimensions (${dimNames}) in ${view._view} are not hidden`,
					hint: `If you want the column to be user-facing, make it the sql for both a hidden Primary Key Dimension, and a separate non-hidden dimension.`,
				});
			}
			for (let pkDimension of pkDimensions) {
				messages.push({
					level: 'info',
					primaryKey: pkNamingConvention(pkDimension)[2],
					location,
					path,
					view: view._view,
					primaryKeys: pkDimensions.map(pkNamingConvention).map((match)=>match[2]).join(', '),
				});
			}
		}
	}
	return {
		messages,
	};

	function flatten(a, b) {
		return a.concat(b);
	}
	function unique(x, i, arr) {
		return arr.indexOf(x)==i;
	}
	function isExempt(obj, rule) {
		return !!(obj.rule_exemptions && obj.rule_exemptions.includes && obj.rule_exemptions.includes(rule));
	}
};
