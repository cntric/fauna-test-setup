import { Client, query } from "faunadb";
import { generate } from "shortid";
import { FaunaEndpoint, getEndpoints, tearDownFaunaEndpoints } from "./faunaEndpoints";
import { FaunaContainer, tearDownFaunaContainers } from "./launchFauna";
export const DefaultPort = 8443;
export const TestPrefix = "fauna-test";
const { CreateDatabase, Databases, Delete, Map, StartsWith, Lambda, Paginate, Filter, Select, Var, Get, Database } = query;
export const interprePort = (args) => {
    return args && args.port ? args.port : DefaultPort;
};
export const interpretContainerArgs = (args) => {
    const port = interprePort(args);
    return {
        HostConfig: {
            PortBindings: {
                [`${port}/tcp`]: [{
                        HostPort: `${port}`
                    }]
            }
        },
        useAvailable: args && args.useContainer ? args.useContainer !== "new" : true,
        useMachine: args && args.useContainer ? args.useContainer !== "machine" : true
    };
};
export const FaunaDatabaseStore = {
    used: {}
};
export const ShellLikeClient = (endpoint) => {
    return new Client({
        secret: endpoint.secret,
        port: endpoint.port,
        scheme: endpoint.scheme,
        domain: endpoint.domain,
        headers: {
            'X-Fauna-Soucre': 'Fauna Shell'
        }
    });
};
export const _FaunaTestDb = async (args) => {
    const _args = {
        ...args,
        port: interprePort(args)
    };
    const containerArgs = interpretContainerArgs(_args);
    const container = await FaunaContainer(containerArgs);
    const endpoint = await FaunaEndpoint(args);
    const client = new Client({
        secret: endpoint.secret,
        port: endpoint.port,
        scheme: endpoint.scheme,
        domain: endpoint.domain
    });
    const name = args && args.name ? `${TestPrefix}-$` : `${TestPrefix}-${generate()}`;
    await client.query(CreateDatabase({
        name: name
    }));
    return {
        container: container,
        endpoint: endpoint,
        name: name,
        client: client
    };
};
export const FaunaTestDb = async (args) => {
    const db = await _FaunaTestDb(args);
    FaunaDatabaseStore.used = {
        ...FaunaDatabaseStore.used,
        [db.name]: db
    };
    return db;
};
export const tearDownAllFaunaTestDbsOnClient = async (client) => {
    return await client.query(Map(Filter(Paginate(Databases()), Lambda(["dbRef"], StartsWith(TestPrefix, Select("name", Get(Var("dbRef")))))), Lambda(["dbRef"], Delete(Var("dbRef")))));
};
export const tearDownAllFaunaTestDbsOnEndpoint = async (endpoint) => {
    const client = ShellLikeClient(endpoint);
    return await tearDownAllFaunaTestDbsOnClient(client);
};
export const tearDownFaunaTestDb = async (db) => {
    const client = ShellLikeClient(db.endpoint);
    return await client.query(Delete(Database(db.name)));
};
export const tearDownAllTestDbs = async () => {
    const endpoints = await getEndpoints();
    return await Promise.all(Object.values(endpoints).map(async (endpoint) => {
        tearDownAllFaunaTestDbsOnEndpoint(endpoint);
    }));
};
export const tearDownTestDbsOnAllUsedEndpoints = async () => {
    const endpoints = Object.values(Object.values(FaunaDatabaseStore.used).reduce((map, db) => {
        return {
            ...map,
            [db.endpoint.alias]: db.endpoint
        };
    }, {}));
    return await Promise.all(Object.values(endpoints).map(async (endpoint) => {
        tearDownAllFaunaTestDbsOnEndpoint(endpoint);
    }));
};
export const tearDownUsedTestDbs = async () => {
    return await Promise.all(Object.values(FaunaDatabaseStore.used).map(async (db) => {
        await tearDownFaunaTestDb(db);
    }));
};
export const teardownFaunaTestDbs = async (mode = "used") => {
    switch (mode) {
        case "used": {
            return await tearDownUsedTestDbs();
        }
        case "endpoints": {
            return await tearDownTestDbsOnAllUsedEndpoints();
        }
        case "all": {
            return await tearDownAllTestDbs();
        }
        default: {
            await tearDownUsedTestDbs();
        }
    }
};
export const DefaultTeardownArgs = {
    dbs: "used"
};
export const teardown = async (args = DefaultTeardownArgs) => {
    const result = await teardownFaunaTestDbs(args.dbs || "used");
    args.endpoints && await tearDownFaunaEndpoints(args.endpoints === "all");
    args.containers && await tearDownFaunaContainers(args.containers === "all");
    return result;
};
