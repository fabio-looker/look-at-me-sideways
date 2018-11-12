/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/fabio-looker/look-at-me-sideways/blob/master/LICENSE.txt */
require('../lib/expect-to-contain-message');

const rule = require('../rules/e1.js');
const {parse} = require('lookml-parser');

describe('Rules', () => {
	describe('E1', () => {
		let warnMessageE1 = {
			rule: 'E1',
			exempt: false,
			level: 'warning',
		};

		let passMessageE1 = {
			rule: 'E1',
			level: 'info',
		};

		it('should pass if all fields in a join use the subsitution operator', () => {
			let result = rule(parse(`model: foo {
				explore: orders {
					join: users {
						relationship: one_to_many
						sql_on: \${orders.1pk_user_id} = \${users.id};;
					}
				}
			}`));
			expect(result).toContainMessage(passMessageE1);
		});

		it('should not warn if liquid syntax is detected and the subsitution operator is not found', () => {
			let result = rule(parse(`model: foo {
				explore: orders {
					join: users {
						relationship: many_to_one
						sql_on: {% if users.created_week._in_query %}
									users.created_week=orders_smry_week.week
								{% else %}
									users.id=orders.user_id
								{% endif %} ;;
					}
				}
			}`));
			expect(result).toContainMessage(passMessageE1);
		});

		it('should warn if not all join fields use the substitution operator', () => {
			let result = rule(parse(`model: foo {
				explore: orders {
					join: users {
						relationship: one_to_many
						sql_on: \${orders.1pk_user_id} = \${users.id} AND orders.country_id = \${users.country_id};;
					}
				}
			}`));
			expect(result).toContainMessage(warnMessageE1);
		});

		it('should warn if no join fields use the substitution operator', () => {
			let result = rule(parse(`model: foo {
				connection: "myconnection"
				explore: orders {
					join: users {
						relationship: one_to_many
						sql_on: orders.1pk_user_id = users.id ;;
					}
				}
			}`));
			expect(result).toContainMessage(warnMessageE1);
		});

		// TODO confirm exemption levels for E rules.
	});
});
