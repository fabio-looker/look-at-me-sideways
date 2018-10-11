module.exports = function(
	project
) {
	let messages = [];
	const pkNamingConvention = (d)=>d._dimension.match(/^([0-9]+pk|pk[0-9]+)_([a-z0-9A-Z_]+)$/);
	for (let file of project.files) {
		let views = file.views || [];
		for (let view of views) {
			let location = 'view: '+view._view;
			let path = '/projects/'+project.name+'/files/'+file._file_path+'#view:'+view._view;
			let pkDimensions = (view.dimensions||[]).filter(pkNamingConvention);
			{ /* Field-only view exemption */
				if(!view.derived_table && !view.sql_table_name && !view.extends){
					for(let rule of ['K1','K2','K3','K4']){
						messages.push({
							location, path, rule, level: 'info',
							description: `Field-only view ${view._view} is exempt from Primary Key Dimension rules`
						})
					}
					continue;
				}
			}
			{ /* Rule K1 */
				let rule = 'K1';
				let exempt = isExempt(file, rule) || isExempt(view, rule);	
				if (!pkDimensions.length) {
					messages.push({
						location, path, rule, exempt, level: 'error',
						description: 'No Primary Key Dimensions found in '+view._view,
					});
					continue;
				}
				messages.push({
					location, path, rule, exempt, level: 'info',
					description: '1 or more Primary Key Dimensions found in '+view._view,
				});
			}
			{ /* Rule K2 */
				let declaredNs = pkDimensions.map(pkNamingConvention).map((match)=>match[1].replace('pk', '')).filter(unique);
				let rule = 'K2';
				let exempt = isExempt(file, rule) || isExempt(view, rule);
				if (declaredNs.length>1) {
					messages.push({
						location, path, rule, exempt, level: 'error',
						description: `Different Primary Key Dimensions in ${view._view} declare different column counts: ${declaredNs.join(', ')}`,
					});
					continue;
				}
				let n = parseInt(declaredNs[0])
				if (n != pkDimensions.length && n !== 0 ) {
					messages.push({
						location, path, rule, exempt, level: 'error',
						description: `View ${view._view} has ${pkDimensions.length} Primary Key Dimension(s) but their names declare ${declaredNs[0]} columns`,
					});
					continue;
				}
				messages.push({
					location, path, rule, exempt, level: 'info',
					description: `Primary Key Dimensions found in ${view._view} are appropriately numbered`,
				});
			}
			{ /* Rule K3 */
				let rule = 'K3';
				let exempt = isExempt(file, rule) || isExempt(view, rule);
				if (pkDimensions.reduce(((min, x)=>x._n<min?x._n:min), 99) !== 0 ||
					pkDimensions.reduce(((max, x)=>x._n>max?x._n:max), 0) !== pkDimensions.length-1 ) {
					messages.push({
						location, path, rule, exempt, level: 'warning',
						description: `Primary Key Dimensions in ${view._view} are not declared before other dimensions`,
					});
				}
			}
			{ /* Rule K4 */
				let dims = pkDimensions.filter((dim)=>!dim.hidden);
				let rule = 'K4';
				let exempt = isExempt(file, rule) || isExempt(view, rule) || dims.every((d)=>isExempt(d, rule));
				let dimNames = dims.map((dim)=>dim._dimension).join(', ');
				if (pkDimensions.some((dim)=>!dim.hidden)) {
					messages.push({
						location, path, rule, exempt, level: 'warning',
						description: `Primary Key Dimensions (${dimNames}) in ${view._view} are not hidden`,
						hint: `If you want the column to be user-facing, make it the sql for both a hidden Primary Key Dimension, and a separate non-hidden dimension.`,
					});
				}
			}
			for (let pkDimension of pkDimensions) {
				//Return PK info for PK index in developer.md
				if(pkDimensions.map(pkNamingConvention).map((match)=>match[1].replace('pk', ''))[0]==='0'){
					continue;
				}
				messages.push({
					location, path, level: 'info',
					primaryKey: pkNamingConvention(pkDimension)[2],
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
