/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/fabio-looker/look-at-me-sideways/blob/master/LICENSE.txt */
const getExemption = require('../lib/get-exemption.js');

module.exports = function(
	project
) {
	let messages = [];
	let files = project.files || [];
	for (let file of files) {
		let views = file.views || [];
		for (let view of views) {
			let location = 'view: '+view._view;
			let path = '/projects/'+project.name+'/files/'+file._file_path+'#view:'+view._view;
			let sql = view.sql_table_name || view.derived_table && view.derived_table.sql
			if(!sql){
				continue;
			}
			let remaining = sql.
				.replace(/\n\s*---\s*\n/,',[SEP],')
				.replace(new RegExp([
					"[^\\\\']+(\\\\.[^\\\\']+)*'",
					'`[^\\\\`]+(\\\\.[^\\\\`]+)*`',
					'"[^\\\\"]+(\\\\.[^\\\\"]+)*"',
					'--[^\\n]*(\\n|$)',
					'/\\*[^*]*(*[^/][^*]*)*\\*/',
					'\\${[^}]*}',
					'{%.*?%}',
					'{{.*?}}'
				].join('|'),'[NONSQL]');
			while(let match = remaining.match(/(^[\s\S]*)(\([^()]*\))([\s\S]*)/){
				remaining = match[1]+'{PAREN}'+match[3];
				let inner = match[2].slice(1,-1)
				if(!inner.match(/^\s*SELECT\s/)){
					//Non-subquery parenthetical
					continue;
				}
				if(inner.match(/^\s*SELECT\s[^,]+(\bFROM|$)/){
					//Single column selects exempt per T9
					continue;
				}
				if(inner.match(/^\s*SELECT\s+\*[\s\S]*?\bFROM\b(?!.*?(,|\bJOIN\b))/)){
					//Single table *+projections selects exempt per T10
					continue;
				}
				let selections = inner
					.replace(/^\s*SELECT\s+/,'').replace(/\s*FROM[\s\S]*$/,'')
					.split(',')
					.map(part=>part.trim())
					.filter(Boolean);
			}
			{/* Field-only view exemption */
				if (!view.derived_table && !view.sql_table_name && !view.extends) {
					for (let rule of ['K1', 'K2', 'K3', 'K4']) {
						messages.push({
							location, path, rule, level: 'info',
							description: `Field-only view ${view._view} is not subject to Primary Key Dimension rules`,
						});
					}
					continue;
				}
			}
			{/* Rule K1 */
				let rule = 'K1';
				let exempt = getExemption(view, rule) || getExemption(file, rule);
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
			{/* Rule K2 */
				let declaredNs = pkDimensions.map(pkNamingConvention).map((match)=>match[1].replace('pk', '')).filter(unique);
				let rule = 'K2';
				let exempt = getExemption(view, rule) || getExemption(file, rule);
				if (declaredNs.length>1) {
					messages.push({
						location, path, rule, exempt, level: 'error',
						description: `Different Primary Key Dimensions in ${view._view} declare different column counts: ${declaredNs.join(', ')}`,
					});
					continue;
				}
				let n = parseInt(declaredNs[0]);
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
			{/* Rule K3 */
				let rule = 'K3';
				let exempt = getExemption(view, rule) || getExemption(file, rule);
				if (pkDimensions.reduce(((min, x)=>x._n<min?x._n:min), 99) !== 0 ||
					pkDimensions.reduce(((max, x)=>x._n>max?x._n:max), 0) !== pkDimensions.length-1 ) {
					messages.push({
						location, path, rule, exempt, level: 'warning',
						description: `Primary Key Dimensions in ${view._view} are not declared before other dimensions`,
					});
				}
			}
			{/* Rule K4 */
				let dims = pkDimensions.filter((dim)=>!dim.hidden);
				let rule = 'K4';
				let exempt = dims.every((d)=>getExemption(d, rule)) || getExemption(view, rule) || getExemption(file, rule);
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
				// Return PK info for PK index in developer.md
				if (pkDimensions.map(pkNamingConvention).map((match)=>match[1].replace('pk', ''))[0]==='0') {
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
};
