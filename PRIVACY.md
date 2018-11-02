# Privacy Policy

Thank you for using LAMS. Looker would like to understand the demand for LAMS,
so that we can continue to support it and develop similar tools in the future.


In order to respect user privacy, we ask LAMS users to opt-in if they would like
to help us understand LAMS usage. In order to enable usage reporting going
forward, add the following options to your first-run of LAMS:

	> lams --reporting=save-yes --report-license-key=AAA...AAA --report-user=bob@acme.com


Both license key and user are optional, but recommended. The information that
is sent to us includes:

	- License key (if provided): Your Looker license key. If the LookML repo to
	  be linted is used by multiple Looker instances, please provide the license
	  key from a production instance.
	- Email (if provided): Your email will be hashed before being sent to us. It
	  may be used to associate your usage of LAMS with other activity or contact
	  records that we have for you. If you prefer, you may provide your email
	  pre-hashed. Please provide to_hex(sha256(utf8(lowercase(email)))).
	- Rule usage information: A count of linter messages per rule number (e.g.,
	  F2, F2), message level (e.g., error, warning, info), and exempt-or-not.
	- Error conditions associated with the execution of the script
	- Standard network & connection information such as IP address


The above preference is saved in ~/.look-at-me-sideways


In order to opt-in to reporting for only a specific run, use `--reporting=yes`

	> lams --reporting=yes --report-license-key=AAA...AAA --report-user=bob@acme.com


In order to opt-out of reporting for a specific run, use

	> lams --reporting=no


In order to opt-out of all reporting going forward, run LAMS once with:

	> lams --reporting=save-no


As with `save-yes`, this preference is saved in ~/.look-at-me-sideways
