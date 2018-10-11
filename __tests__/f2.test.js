require('../lib/expect-to-contain-message');

const rule = require('../rules/f2');
const {parse} = require('../../node-lookml-parser');

//const peek = (fn = x=>x) => (o) => {console.log(fn(o));return o}

describe('Rules', () => {
	describe('F2', () => {
		let warnMessageF2 = {
			rule: 'F2',
			exempt: false,
			level: 'warning',
		};
		
		it('should not warn if there are no files',() => {
			let result = rule(parse(``));
			expect(result).not.toContainMessage(warnMessageF2);
		});
		
		it('should not warn if there are no views',() => {
			let result = rule(parse(`file: f {}`));
			expect(result).not.toContainMessage(warnMessageF2);
		});
		
		it('should not warn for a view with no fields',() => {
			let result = rule(parse(`file: f {
				view: foo {}
			}`));
			expect(result).not.toContainMessage(warnMessageF2);
		});
		
		it('should not warn for a field with no view_label', () => {
			let result = rule(parse(`file: f {
				view: foo {
					dimension: bar {}
				}
			}`));
			expect(result).not.toContainMessage(warnMessageF2);
		});
		
		it('should warn for a dimension with a view_label', () => {
			let result = rule(parse(`file: f {
				view: foo {
					dimension: bar { view_label: "Foo2" }
				}
			}`));
			expect(result).toContainMessage(warnMessageF2);
		});
		
		it('should warn for a measure with a view_label', () => {
			let result = rule(parse(`file: f {
				view: foo {
					measure: bar { view_label: "Foo2" }
				}
			}`));
			expect(result).toContainMessage(warnMessageF2);
		});
		
		it('should warn for a filter with a view label', () => {
			let result = rule(parse(`file: f {
				view: foo {
					filter: bar { view_label: "Foo2" }
				}
			}`));
			expect(result).toContainMessage(warnMessageF2);
		});
		
		it('should warn for a parameter with a view label', () => {
			let result = rule(parse(`file: f {
				view: foo {
					parameter: bar { view_label: "Foo2" }
				}
			}`));
			expect(result).toContainMessage(warnMessageF2);
		});
		
		it('should warn for an empty-string view_label', () => {
			let result = rule(parse(`file: f {
				view: foo {
					dimension: bar { view_label: "" }
				}
			}`));
			expect(result).toContainMessage(warnMessageF2);
		});
		
		it('should not warn for an F2 exempted view', () => {
			let result = rule(parse(`file: f {
				view: foo {
					rule_exemptions: [F2]
					dimension: bar { view_label: "Foo2" }
				}
			}`));
			expect(result).not.toContainMessage(warnMessageF2);
		});
		
		it('should not warn for an F2 exempted field', () => {
			let result = rule(parse(`file: f {
				view: foo {
					dimension: bar {
						rule_exemptions: [F2]
						view_label: "Foo2"
					}
				}
			}`));
			expect(result).not.toContainMessage(warnMessageF2);
		});
		
		it('should warn for an otherwise exempted view', () => {
			let result = rule(parse(`file: f {
				view: foo {
					rule_exemptions: [X1]
					dimension: bar { view_label: "Foo2" }
				}
			}`));
			expect(result).toContainMessage(warnMessageF2);
		});
		
		it('should warn for an otherwise exempted field', () => {
			let result = rule(parse(`file: f {
				view: foo {
					dimension: bar {
						rule_exemptions: [X1]
						view_label: "Foo2"
					}
				}
			}`));
			expect(result).toContainMessage(warnMessageF2);
		});
	});
});