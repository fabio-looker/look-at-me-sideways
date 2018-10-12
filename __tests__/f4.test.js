require('../lib/expect-to-contain-message');

const rule = require('../rules/f4');
const {parse} = require('lookml-parser');

//const peek = (fn = x=>x) => (o) => {console.log(fn(o));return o}

describe('Rules', () => {
	describe('F4', () => {
		let warnMessageF4 = {
			rule: 'F4',
			exempt: false,
			level: 'warning',
		};
		
		it('should not warn if there are no files',() => {
			let result = rule(parse(``));
			expect(result).not.toContainMessage(warnMessageF4);
		});
		
		it('should not warn if there are no views',() => {
			let result = rule(parse(`file: f {}`));
			expect(result).not.toContainMessage(warnMessageF4);
		});
		
		it('should not warn for a view with no fields',() => {
			let result = rule(parse(`file: f {
				view: foo {}
			}`));
			expect(result).not.toContainMessage(warnMessageF4);
		});
		
		it('should warn for a dimension with no description and no hidden', () => {
			let result = rule(parse(`file: f {
				view: foo {
					dimension: bar {}
				}
			}`));
			expect(result).toContainMessage(warnMessageF4);
		});
		
		it('should warn for a dimension with no description and hidden:no', () => {
			let result = rule(parse(`file: f {
				view: foo {
					dimension: bar { hidden: no }
				}
			}`));
			expect(result).toContainMessage(warnMessageF4);
		});
		
		it('should warn for a dimension with an empty string description', () => {
			let result = rule(parse(`file: f {
				view: foo {
					dimension: bar { description: "" }
				}
			}`));
			expect(result).toContainMessage(warnMessageF4);
		});
		
		it('should not warn for a dimension with hidden:yes', () => {
			let result = rule(parse(`file: f {
				view: foo {
					dimension: bar { hidden: yes }
				}
			}`));
			expect(result).not.toContainMessage(warnMessageF4);
		});
		
		it('should not warn for a dimension with a non-blank description', () => {
			let result = rule(parse(`file: f {
				view: foo {
					dimension: bar { description: "Barry bar" }
				}
			}`));
			expect(result).not.toContainMessage(warnMessageF4);
		});
		
		it('should warn for measures', () => {
			let result = rule(parse(`file: f {
				view: foo {
					measure: bar {}
				}
			}`));
			expect(result).toContainMessage(warnMessageF4);
		});
		
		it('should warn for filters', () => {
			let result = rule(parse(`file: f {
				view: foo {
					filter: bar {}
				}
			}`));
			expect(result).toContainMessage(warnMessageF4);
		});
		
		it('should warn for parameters', () => {
			let result = rule(parse(`file: f {
				view: foo {
					parameter: bar {}
				}
			}`));
			expect(result).toContainMessage(warnMessageF4);
		});
		
		it('should not error for an F4 exempted view', () => {
			let result = rule(parse(`file: f {
				view: foo {
					rule_exemptions: [F4]
					measure: bar { type:count }
				}
			}`));
			expect(result).not.toContainMessage(warnMessageF4);
		});
		
		it('should not error for an F4 exempted field', () => {
			let result = rule(parse(`file: f {
				view: foo {
					measure: bar {
						rule_exemptions: [F4]
						type: count
					}
				}
			}`));
			expect(result).not.toContainMessage(warnMessageF4);
		});
		
		it('should error for an otherwise exempted view', () => {
			let result = rule(parse(`file: f {
				view: foo {
					rule_exemptions: [X1]
					measure: bar { type: count }
				}
			}`));
			expect(result).toContainMessage(warnMessageF4);
		});
		
		it('should error for an otherwise exempted field', () => {
			let result = rule(parse(`file: f {
				view: foo {
					measure: bar {
						rule_exemptions: [X1]
						type: count
					}
				}
			}`));
			expect(result).toContainMessage(warnMessageF4);
		});
	});
});