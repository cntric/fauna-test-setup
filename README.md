# fauna-test-setup
A package for setting up [Fauna Dev](https://docs.fauna.com/fauna/current/integrations/dev) servers with minimal hassel.

`yarn add --dev https://github.com/concentricio/fauna-test-setup`

- [`FaunaTestDb()`](#FaunaTestDb)
- [`teardown()`](#teardown)

## Motivation
The process of setting up [Fauna Dev](https://docs.fauna.com/fauna/current/integrations/dev) servers to test Fauna logic can be cumbersome and detached from the actual development of test suites. This package automates test server setup, so you can do it inline and in a single line.

```typescript
const testDb = await FaunaTestDb();
```

Besides this package, you only need to make sure you have [Docker](https://www.docker.com/) installed and running.   

<a name="FaunaTestDb">
## `FaunaTestDb`
</a>
You can create a database and test against it without any additional setup:
```typescript
import {FaunaTestDB} from "fauna-test-setup";

// Jest example
describe("Basic functionality", ()=>{
        test("Addition", async ()=>{

            const {
                client
            } = await FaunaTestDb();
    
            const result = await client.query(Add(2, 2));
            expect(result).toBe(4)

        }, 5000)
})
```
### Automation
If needed, `FaunaTestDb()` will automatically...
- pull the `fauna/faunadb` Docker image,
- deploy a container with the `fauna/faunadb` Docker image,
- create a Fauna endpoint and forward it to the desired port,
- create a test database.

### Reuse
By default, `FaunaTestDb()` will...
- reuse Docker containers running with the `fauna/faunadb` image,
- reuse endpoints deployed on the desired port,
- NOT reuse previous test databases.

<a name="teardown">
## `teardown`
</a>
`fauna-test-setup` will **NOT** automatically tear down your testing environment. However, a `teardown()` method is provided.
```typescript
import {teardown} from "fauna-test-setup";
// Jest example
afterAll(async ()=>{
  await teardown();
})
```
### Default
By default, `teardown()` will...
- delete any test databases used during the running of the application.

### Additional
`teardown()` can additionally be configured to...
- delete Fauna endpoints within or without the context of the application,
- remove `fauna/faunadb` Docker containers within or without the context of the application.

## Docs
From within the package directory, `yarn run docs`.
