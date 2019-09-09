# track-db-test-library
Test library for Track database challenges

## Usage

### `Connection` module

Handles SQLite connection.

#### `Connection#knex`

Raw knex connection object.

#### async `Connection#query(sql, opt_args)`

Queries a single SQL.

```javascript
const employees = await conn.query("SELECT * AS count FROM emp");
employees.forEach(({empno, deptno, name}) => console.log(name));
```

#### async `Connection#queryPlan(sql, opt_args)`

Queries execution plan for a single SQL.

```javascript
// equivalent to:
//   const plansForSelectEmployees = await conn.queryPlan("EXPLAIN QUERY PLAN SELECT * AS count FROM emp");
const plansForSelectEmployees = await conn.queryPlan("SELECT * AS count FROM emp");
```

#### async `Connection#queryFromFile(path, opt_args)`

Queries SQLs from file.

```javascript
const {sql, records} = await conn.queryFromFile("emp.sql")[0];
console.log(sql); // SELECT * AS count FROM emp
records.forEach(({empno, deptno, name}) => console.log(name));
```

#### async `Connection#queryPlansFromFile(path, opt_args)`

Queries SQLs from file.

```javascript
const {sql, records} = await conn.queryFromFile("emp.sql")[0];
console.log(sql); // EXPLAIN QUERY PLAN SELECT * AS count FROM emp
```

#### async `Connection#loadFromCSV(path, table)`

Loads records from CSV and inserts them into the given table

### `format` module
#### `format.records([message, sql,] records)`

Format `records` as a table.

```javascript
console.log(
  format(
      [{ empno: 1, deptno: 10, name: "Scott" }]
  )
);
```

```
----------  ----------  ----------
empno       deptno      name      
----------  ----------  ----------
1           10          Scott     
----------  ----------  ----------
```

```javascript
console.log(
  format(
      'Employee tables',
      'SELECT * FROM emp',
      [{ empno: 1, deptno: 10, name: "Scott" }]
  )
);
```

```
Employee tables
SELECT * FROM emp
1 row(s) selected
----------  ----------  ----------
empno       deptno      name      
----------  ----------  ----------
1           10          Scott     
----------  ----------  ----------
```

### `i18n` module

Supports internationalization.

#### `i18n.text`

Returns the translation for the given `string`.
It supports for tagged template string style.

`locale/en.yml`
```yaml
"[基本実装] SELECT 文で適切なレコードを取得できる": "[Basic Case] Appropriate records can be fetched by SELECT statements"
```

```javascript
const _ = require('track-db-test-library').i18n.text;

// [Basic Case] Appropriate records can be fetched by SELECT statements
console.log(_('[基本実装] SELECT 文で適切なレコードを取得できる'));
console.log(_`[基本実装] SELECT 文で適切なレコードを取得できる`);
```

### `assertions` module

Introduces a new assertion to `chai.expect`.

To enable the assertions, use `chai.use` as follows:

```javascript
const chai = require('chai');
const dblib = require('track-db-test-library');
chai.use(dblib.assertions);
```

#### `recordEqual(expected, opt_message)`

Deep and fuzzy `equal` which ignores case of keys and ignores `string` / `number` type of values.

```javascript
expect([
  { EMPNO: "1", DEPTNO: "10", NAME: "Scott" }
]).to.recordEqual([
  { empno: 1, deptno: 10, name: "Scott" }
]);
``` 

#### `fullscan`

Checks if table full scan is planned to `Connection#queryPlan()` results.

```javascript
expect([
    {id:  4, parent: 0, notused: 0, detail: 'SCAN TABLE rooms'},
    {id: 10, parent: 0, notused: 0, detail: 'SEARCH TABLE hotels USING INTEGER PRIMARY KEY (rowid=?)'},
    {id: 28, parent: 0, notused: 0, detail: 'USE TEMP B-TREE FOR ORDER BY'}
]).to.fullscan(['tables', 'rooms']) // by default, checks if 'any' from given tables will be fully scanned
```

## License

This software is released under the [MIT License](LICENSE).
