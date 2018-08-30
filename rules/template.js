module.exports = function({
	project
	//outputs from other rules?
}){

	return {
		messages:[
			{	level:"debug|info|warn|error",
				exempt: true || false, //If any of the containing objects have rule_exemptions.contains(rule)
				path:"file:<file>/view:<view>, or model:<model>/view:<view>/dimension:<dimension>, etc",
				description:"..."
				}
			]
		}
	}