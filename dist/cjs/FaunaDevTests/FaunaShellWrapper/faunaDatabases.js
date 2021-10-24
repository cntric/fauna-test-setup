"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.teardown = exports.DefaultTeardownArgs = exports.teardownFaunaTestDbs = exports.tearDownUsedTestDbs = exports.tearDownTestDbsOnAllUsedEndpoints = exports.tearDownAllTestDbs = exports.tearDownFaunaTestDb = exports.tearDownAllFaunaTestDbsOnEndpoint = exports.tearDownAllFaunaTestDbsOnClient = exports.FaunaTestDb = exports._FaunaTestDb = exports.ShellLikeClient = exports.FaunaDatabaseStore = exports.interpretContainerArgs = exports.interprePort = exports.TestPrefix = exports.DefaultPort = void 0;
const faunadb_1 = require("faunadb");
const shortid_1 = require("shortid");
const faunaEndpoints_1 = require("./faunaEndpoints");
const launchFauna_1 = require("./launchFauna");
exports.DefaultPort = 8443;
exports.TestPrefix = "fauna-test";
const { CreateDatabase, Databases, Delete, Map, StartsWith, Lambda, Paginate, Filter, Select, Var, Get, Database } = faunadb_1.query;
const interprePort = (args) => {
    return args && args.port ? args.port : exports.DefaultPort;
};
exports.interprePort = interprePort;
const interpretContainerArgs = (args) => {
    const port = (0, exports.interprePort)(args);
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
exports.interpretContainerArgs = interpretContainerArgs;
exports.FaunaDatabaseStore = {
    used: {}
};
const ShellLikeClient = (endpoint) => {
    return new faunadb_1.Client({
        secret: endpoint.secret,
        port: endpoint.port,
        scheme: endpoint.scheme,
        domain: endpoint.domain,
        headers: {
            'X-Fauna-Soucre': 'Fauna Shell'
        }
    });
};
exports.ShellLikeClient = ShellLikeClient;
const _FaunaTestDb = (args) => __awaiter(void 0, void 0, void 0, function* () {
    const _args = Object.assign(Object.assign({}, args), { port: (0, exports.interprePort)(args) });
    const containerArgs = (0, exports.interpretContainerArgs)(_args);
    const container = yield (0, launchFauna_1.FaunaContainer)(containerArgs);
    const endpoint = yield (0, faunaEndpoints_1.FaunaEndpoint)(args);
    const client = new faunadb_1.Client({
        secret: endpoint.secret,
        port: endpoint.port,
        scheme: endpoint.scheme,
        domain: endpoint.domain
    });
    const name = args && args.name ? `${exports.TestPrefix}-$` : `${exports.TestPrefix}-${(0, shortid_1.generate)()}`;
    yield client.query(CreateDatabase({
        name: name
    }));
    return {
        container: container,
        endpoint: endpoint,
        name: name,
        client: client
    };
});
exports._FaunaTestDb = _FaunaTestDb;
const FaunaTestDb = (args) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield (0, exports._FaunaTestDb)(args);
    exports.FaunaDatabaseStore.used = Object.assign(Object.assign({}, exports.FaunaDatabaseStore.used), { [db.name]: db });
    return db;
});
exports.FaunaTestDb = FaunaTestDb;
const tearDownAllFaunaTestDbsOnClient = (client) => __awaiter(void 0, void 0, void 0, function* () {
    return yield client.query(Map(Filter(Paginate(Databases()), Lambda(["dbRef"], StartsWith(exports.TestPrefix, Select("name", Get(Var("dbRef")))))), Lambda(["dbRef"], Delete(Var("dbRef")))));
});
exports.tearDownAllFaunaTestDbsOnClient = tearDownAllFaunaTestDbsOnClient;
const tearDownAllFaunaTestDbsOnEndpoint = (endpoint) => __awaiter(void 0, void 0, void 0, function* () {
    const client = (0, exports.ShellLikeClient)(endpoint);
    return yield (0, exports.tearDownAllFaunaTestDbsOnClient)(client);
});
exports.tearDownAllFaunaTestDbsOnEndpoint = tearDownAllFaunaTestDbsOnEndpoint;
const tearDownFaunaTestDb = (db) => __awaiter(void 0, void 0, void 0, function* () {
    const client = (0, exports.ShellLikeClient)(db.endpoint);
    return yield client.query(Delete(Database(db.name)));
});
exports.tearDownFaunaTestDb = tearDownFaunaTestDb;
const tearDownAllTestDbs = () => __awaiter(void 0, void 0, void 0, function* () {
    const endpoints = yield (0, faunaEndpoints_1.getEndpoints)();
    return yield Promise.all(Object.values(endpoints).map((endpoint) => __awaiter(void 0, void 0, void 0, function* () {
        (0, exports.tearDownAllFaunaTestDbsOnEndpoint)(endpoint);
    })));
});
exports.tearDownAllTestDbs = tearDownAllTestDbs;
const tearDownTestDbsOnAllUsedEndpoints = () => __awaiter(void 0, void 0, void 0, function* () {
    const endpoints = Object.values(Object.values(exports.FaunaDatabaseStore.used).reduce((map, db) => {
        return Object.assign(Object.assign({}, map), { [db.endpoint.alias]: db.endpoint });
    }, {}));
    return yield Promise.all(Object.values(endpoints).map((endpoint) => __awaiter(void 0, void 0, void 0, function* () {
        (0, exports.tearDownAllFaunaTestDbsOnEndpoint)(endpoint);
    })));
});
exports.tearDownTestDbsOnAllUsedEndpoints = tearDownTestDbsOnAllUsedEndpoints;
const tearDownUsedTestDbs = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield Promise.all(Object.values(exports.FaunaDatabaseStore.used).map((db) => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, exports.tearDownFaunaTestDb)(db);
    })));
});
exports.tearDownUsedTestDbs = tearDownUsedTestDbs;
const teardownFaunaTestDbs = (mode = "used") => __awaiter(void 0, void 0, void 0, function* () {
    switch (mode) {
        case "used": {
            return yield (0, exports.tearDownUsedTestDbs)();
        }
        case "endpoints": {
            return yield (0, exports.tearDownTestDbsOnAllUsedEndpoints)();
        }
        case "all": {
            return yield (0, exports.tearDownAllTestDbs)();
        }
        default: {
            yield (0, exports.tearDownUsedTestDbs)();
        }
    }
});
exports.teardownFaunaTestDbs = teardownFaunaTestDbs;
exports.DefaultTeardownArgs = {
    dbs: "used"
};
const teardown = (args = exports.DefaultTeardownArgs) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield (0, exports.teardownFaunaTestDbs)(args.dbs || "used");
    args.endpoints && (yield (0, faunaEndpoints_1.tearDownFaunaEndpoints)(args.endpoints === "all"));
    args.containers && (yield (0, launchFauna_1.tearDownFaunaContainers)(args.containers === "all"));
    return result;
});
exports.teardown = teardown;
