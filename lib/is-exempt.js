/** Checks whether an object directly declares an exemption for a given rule
 * @param {object} obj An object, usually from lookml-parser, to be checked for exemptions
 * @param {string} rule A string representing the rule to be checked for exemption from. E.g., 'K1'
 * @return {boolean} Does the object have the specified rule_exemptions
 */
exports = module.exports = function isExempt(obj, rule) {
	return !!(obj.rule_exemptions && typeof obj.rule_exemptions[rule] === 'string' && obj.rule_exemptions[rule]);
};
