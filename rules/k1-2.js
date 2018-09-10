module.exports = function(
	project
	//outputs from other rules?
){
	var messages = []
	const views = project.files.map(m=>m.views).filter(Boolean).reduce(flatten,[])
	const pkNamingConvention = d=>d._dimension.match(/^([0-9]+pk|pk[0-9]+)_([a-z0-9A-Z_]+)$/)
	for(file of project.files){
		let views = file.views || [] 
		for(view of views){
			let path = "/projects/"+project.name+"/files/"+file._file_path+"#view:"+view._view
			let pkDimensions = view.dimensions.filter(pkNamingConvention)
			if(!pkDimensions.length){
				let rule = "K1", exempt = isExempt(file,rule) || isExempt(view,rule)
				messages.push({
					path, rule, exempt, level:"error",
					description:"No Primary Key Dimensions found in "+view._view
					})
				continue
				}
			let declaredNs = pkDimensions.map(pkNamingConvention).map(match=>match[1].replace("pk","")).filter(unique)
			if(declaredNs.length>1){
				let rule = "K2", exempt = isExempt(file,rule) || isExempt(view,rule)
				messages.push({
					path, rule, exempt, level:"error",
					description:"Different Primary Key Dimensions in "+view._view+" declare different column counts: "+declaredNs.join(", ")
					})
				continue
				}
			if(pkDimensions.length != parseInt(declaredNs[0])){
				let rule = "K2", exempt = isExempt(file,rule) || isExempt(view,rule)
				messages.push({
					path, rule, exempt, level:"error",
					description:`View ${view._view} has ${pkDimensions.length} Primary Key Dimension(s) but their names declare ${declaredNs[0]} columns`
					})
				continue
				}
			if(!pkDimensions.reduce(((min,x)=>x._n<min?x._n:min),99) !== 0 && !pkDimensions.reduce(((max,x)=>x._n>max?x._n:max),0) !== pkDimensions.length ){
				let rule = "K3", exempt = isExempt(file,rule) || isExempt(view,rule)
				messages.push({
					path, rule, exempt, level:"warning",
					description:`Primary Key Dimensions in ${view._view} are not declared before other dimensions`
					})
				}
			if(pkDimensions.some(dim=>!dim.hidden)){
				let rule = "K3", exempt = isExempt(file,rule) || isExempt(view,rule)
				let dims = pkDimensions.filter(dim=>!dim.hidden).map(dim=>dim._dimension).join(", ")
				messages.push({
					path, rule, exempt, level:"warning",
					description:`Primary Key Dimensions (${dims}) in ${view._view} are not hidden`
					hint:`If you want the column to be user-facing, make it the sql for both a hidden Primary Key Dimension, and a separate non-hidden dimension.`
					})
				}
			for(pkDimension of pkDimensions){
				messages.push({
					level:"info",
					primaryKey: pkNamingConvention(pkDimension)[2],
					path,
					view:view._view,
					primaryKeys:pkDimensions.map(pkNamingConvention).map(match=>match[2]).join(", ")
					})
				}
			}
		}
	return {
		messages
		}
		
	function flatten(a,b){return a.concat(b)}
	function unique(x,i,arr){return arr.indexOf(x)==i}
	function isExempt(obj,rule){return !!(obj.rule_exemptions && obj.rule_exemptions.contains && obj.rule_exemptions.contains(rule))}
	}