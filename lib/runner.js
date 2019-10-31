const YAML = require('yaml');
const fs = require('fs');
const expect = require('chai').expect;

const assertions = require('./assertions');
const Connection = require('./connection');
const _ = require('./i18n').text;

const lang = process.env.CHALLENGE_LANGUAGE || 'ja';

function use(chai) {
	chai.use(assertions);
}

function isString(x) {
	return (typeof x === 'string') || (x instanceof String);
}

function isArray(x) {
	return (typeof x.length) === 'number';
}

function ext(s) {
	return file.split['.'].slice(-1)[0];
}

async function exec(s) {
	if (isString(s)) {
		if (s.startsWith('@')) {
			let [target, table] = s.substr(1).split(' into ').map(x => x.trim());
			switch (ext(target)) {
				case 'sql':
					return await conn.queryFromFile(target).map(r => r.records);
				case 'csv':
					await conn.loadFromCSV(target, table);
					return [];
			}
		} else {
			return conn.query(s);
		}
	} else {
		if (isString(s.plan)) {
			if (s.plan.startsWith('@')) {
				return await conn.queryPlanFromFile(s.plan.substr(1)).map(r => r.records);
			} else {
				return [await conn.queryPlan(s.plan)];
			}
		}
	}
	throw new Error(`Unsupported execution: ${s}`);
}

function check(actual, expected) {
	if (isString(expected)) {
		if (expected.startsWith("@")) {
			expected = expected.substr(1);
		}
		expect(actual).to.recordEqualToCsv(expected);
	} else if (!!expected.noFullscan) {
		expect(actual).not.to.fullscan(expected.noFullscan);
	} else {
		let x = expect(actual);
		if (!!expected.columns) {
			x = x.columns(expected.columns);
		}
		if (!!expected.without) {
			x = x.without(expected.without);
		}
		if (!!expected.orderBy) {
			x = x.orderBy(expected.orderBy);
		}
		if (isArray(expected.equalTo)) {
			x.to.recordEqual(expected.equalTo);
		} else if (isString(expected.equalTo) && ext(expected.equalTo) === 'csv') {
			x.to.recordEqualToCsv(expected.equalTo);
		} else {
			throw new Error(`Invalid testcase`);
		}
	}
}

function run(suite, settings) {
	if (!settings) {
		settings = suite;
		suite = '';
	}
	const { installations, cleanups, tests } = normalizeSettings(settings);

	describe('', () => {
		before(_`Initializing database...`, async () => {
			conn = new Connection();
			for (let i of installations || []) {
				await exec(i);
			}
		});

		for (let test of tests || []) {
			it(isString(test.title) ? _(test.title) : test.title[lang], async () => {
				let arrange = !test.arrange ? [] : isArray(test.arrange) ? test.arrange : [test.arrange];
				for (let x of arrange) {
					await exec(x);
				}

				let act = isArray(test.act) ? test.act : [test.act];
				let actuals = [];
				for (let x of act) {
					actuals.push(await exec(x));
				}

				let assert = isArray(test.assert) ? test.assert : [test.assert];
				expect(actuals).to.have.lengthOf(assert.length, _`Invalid number of queries is executed`);
				for (let i = 0, length = actuals.length; i < length; i++) {
					check(actuals[i], assert[i]);
				}
			});
		}
	});
}

function normalizeSettings(settings) {
	if (isString(settings)) {
		settings = load(settings);
	}
	if (isArray(settings)) {
		settings = {
			installations: [],
			cleanups: [],
			tests: settings
		};
	}
	return JSON.parse(JSON.stringify(settings || {})); // deep clone
}

function load(file) {
	const content = fs.readFileSync(file, 'utf-8');
	switch (ext(file)) {
		case 'yaml':
		case 'yml':
			return YAML.parse(content);
		case 'json':
			return JSON.parse(content);
		default:
			throw new Error(`Unsupported file format: ${file}`);
	}
}

module.exports = {
	use: use,
	run: run
};
