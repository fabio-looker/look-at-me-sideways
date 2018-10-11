require('../lib/expect-to-contain-message');

const rule = require('../rules/f3');
const {parse} = require('lookml-parser');

//const peek = (fn = x=>x) => (o) => {console.log(fn(o));return o}

describe('Rules', () => {
	describe('F3', () => {
		let failMessageF3 = {
			rule: 'F3',
			exempt: false,
			level: 'error',
		};
		
		it('should not error if there are no files',() => {
			let result = rule(parse(``));
			expect(result).not.toContainMessage(failMessageF3);
		});
		
		it('should not error if there are no views',() => {
			let result = rule(parse(`file: f {}`));
			expect(result).not.toContainMessage(failMessageF3);
		});
		
		it('should not error for a view with no fields',() => {
			let result = rule(parse(`file: f {
				view: foo {}
			}`));
			expect(result).not.toContainMessage(failMessageF3);
		});
		
		it('should error for a measure with a type:count and no filter', () => {
			let result = rule(parse(`file: f {
				view: foo {
					measure: bar { type: count }
				}
			}`));
			expect(result).toContainMessage(failMessageF3);
		});
		
		it('should not error for a measure with a type:count and 1 filter', () => {
			let result = rule(parse(`file: f {
				view: foo {
					measure: bar { 
						type: count
						filter: {
							field: id
							value: "-null"
						}
					}
				}
			}`));
			expect(result).not.toContainMessage(failMessageF3);
		});
	
		it('should not error for a measure with a type:count and 2 filter', () => {
			let result = rule(parse(`file: f {
				view: foo {
					measure: bar { 
						type: count
						filter: {
							field: id
							value: "-null"
						}
						filter: {
							field: baz
							value: "active"
						}
					}
				}
			}`));
			expect(result).not.toContainMessage(failMessageF3);
		});
		
		it('should not error for an F3 exempted view', () => {
			let result = rule(parse(`file: f {
				view: foo {
					rule_exemptions: [F3]
					measure: bar { type:count }
				}
			}`));
			expect(result).not.toContainMessage(failMessageF3);
		});
		
		it('should not error for an F3 exempted field', () => {
			let result = rule(parse(`file: f {
				view: foo {
					measure: bar {
						rule_exemptions: [F3]
						type: count
					}
				}
			}`));
			expect(result).not.toContainMessage(failMessageF3);
		});
		
		it('should error for an otherwise exempted view', () => {
			let result = rule(parse(`file: f {
				view: foo {
					rule_exemptions: [X1]
					measure: bar { type: count }
				}
			}`));
			expect(result).toContainMessage(failMessageF3);
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
			expect(result).toContainMessage(failMessageF3);
		});
	});
});