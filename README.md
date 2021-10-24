# fauna-test-setup
A package for setting up Fauna test development servers with minimal hassel.

## Motivation
The process of setting up development servers to test Fauna logic can be cumbersome and detached from the actual development of test suites. This package automates test server setup.

With this package you can create test databases on the fly, without having to worry about what's going on behind the scenes.

```typescript
const testDb = await FaunaTestDb();
```

Besides this package, you only need to make sure you have [Docker](https://www.docker.com/) installed and running.   

## Setup
You can setup a database for testing against a Fauna development server as follows:
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
 }
```
If needed, `FaunaTestDb()` will automatically...
- pull the `fauna/faunadb` Docker image,
- deploy a container with the `fauna/faunadb` Docker image,
- create a Fauna endpoint and forward it to the desired port,
- create a test database.

By default, `FaunaTestDb()` will...
- reuse Docker containers running with the `fauna/faunadb` image,
- resuse endpoints deployed on the desired port,
- NOT reuse previous test databases.

## Tearing down the test environment
This `fauna-test-setup` will not automatically tear down your testing environment. However, a `teardown()` method is provided.
```typescript
// Jest example
afterAll(async ()=>{
  await teardown();
})
```
By default, `teardown()` will...
- delete any test databases allocated during the running of the application.

`teardown()` can additionally be configured to...
- delete Fauna endpoints created within or without the context of the application,
- remove `fauna/faunadb` Docker containers within or without the context of the application.
