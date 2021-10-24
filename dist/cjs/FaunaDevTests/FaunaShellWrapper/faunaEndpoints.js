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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tearDownFaunaEndpoints = exports.tearDownUsedFaunaEndponts = exports.tearDownFaunaEndpointsOnMachine = exports.FaunaEndpoint = exports._FaunaEndpoint = exports.addEndpointToUsed = exports.FaunaEndpointStore = exports.createLocalHostEndpoint = exports.findLocalHostEndpoint = exports.getEndpoints = exports.saveEndpointOrError = exports.loadEndpoints = exports.fileNotFound = exports.getConfigFile = exports.readFile = exports.DefaultScheme = exports.DeafultPort = void 0;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const ini_1 = __importDefault(require("ini"));
const request_promise_1 = __importDefault(require("request-promise"));
const shortid_1 = require("shortid");
const LocalHost = "localhost";
exports.DeafultPort = 8443;
exports.DefaultScheme = "http";
const FAUNA_CLOUD_DOMAIN = 'db.fauna.com';
const ERROR_NO_DEFAULT_ENDPOINT = "You need to set a default endpoint. \nTry running 'fauna default-endpoint ENDPOINT_ALIAS'.";
const ERROR_WRONG_CLOUD_ENDPOINT = "You already have an endpoint 'cloud' defined and it doesn't point to 'db.fauna.com'.\nPlease fix your '~/.fauna-shell' file.";
const ERROR_SPECIFY_SECRET_KEY = 'You must specify a secret key to connect to FaunaDB';
/**
 * FROM FAUNA SHELL: https://github.com/fauna/fauna-shell/blob/0fa47bdd8e2967c6ea957b13264646e80b98c227/src/lib/misc.js#L224
 * Wraps `fs.readFile` into a Promise.
 */
function readFile(fileName) {
    return new Promise(function (resolve, reject) {
        fs_1.default.readFile(fileName, 'utf8', (err, data) => {
            err ? reject(err) : resolve(data);
        });
    });
}
exports.readFile = readFile;
/**
 * FROM FAUNA SHELL: https://github.com/fauna/fauna-shell/blob/0fa47bdd8e2967c6ea957b13264646e80b98c227/src/lib/misc.js#L217
 * Returns the full path to the `.fauna-shell` config file
 */
function getConfigFile() {
    return path_1.default.join(os_1.default.homedir(), '.fauna-shell');
}
exports.getConfigFile = getConfigFile;
/**
 * FROM FAUNA SHELL: https://github.com/fauna/fauna-shell/blob/0fa47bdd8e2967c6ea957b13264646e80b98c227/src/lib/misc.js#L246
 * Tests if an error is of the type "file not found".
 */
function fileNotFound(err) {
    return err.code === 'ENOENT' && err.syscall === 'open';
}
exports.fileNotFound = fileNotFound;
/**
 * FROM FAUNA SHELL: https://github.com/fauna/fauna-shell/blob/0fa47bdd8e2967c6ea957b13264646e80b98c227/src/lib/misc.js#L109
 * Loads the endpoints from the ~/.fauna-shell file.
 * If the file doesn't exist, returns an empty object.
 */
function loadEndpoints() {
    return readFile(getConfigFile())
        .then(function (configData) {
        return ini_1.default.parse(configData);
    })
        .catch(function (err) {
        if (fileNotFound(err)) {
            return {};
        }
        throw err;
    });
}
exports.loadEndpoints = loadEndpoints;
/**
 * FROM FAUNA SHELL: https://github.com/fauna/fauna-shell/blob/0fa47bdd8e2967c6ea957b13264646e80b98c227/src/lib/misc.js#L122
 * @param endpoints
 * @param endpointAlias
 * @returns
 */
function endpointExists(endpoints, endpointAlias) {
    return endpointAlias in endpoints;
}
/**
 * FROM FAUNA SHELL: https://github.com/fauna/fauna-shell/blob/0fa47bdd8e2967c6ea957b13264646e80b98c227/src/lib/misc.js#L167
 * @param config
 * @param endpoint
 * @param alias
 * @param secret
 * @returns
 */
function addEndpoint(config, endpoint, alias, secret) {
    if (shouldSetAsDefaultEndpoint(config)) {
        config.default = alias;
    }
    config[alias] = buildEndpointObject(endpoint, secret);
    return config;
}
/**
 *
 * @param endpoints
 * @param alias
 * @returns
 */
function deleteEndpoint(endpoints, alias) {
    if (endpoints.default === alias) {
        delete endpoints.default;
        console.log(`Endpoint '${alias}' deleted. '${alias}' was the default endpoint.`);
        console.log(ERROR_NO_DEFAULT_ENDPOINT);
    }
    delete endpoints[alias];
    return saveConfig(endpoints);
}
function shouldSetAsDefaultEndpoint(config) {
    return 'default' in config === false;
}
function buildEndpointObject(endpoint, secret) {
    return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (endpoint.hostname && { domain: endpoint.hostname })), (endpoint.port && { port: endpoint.port })), (endpoint.protocol && { scheme: endpoint.protocol.slice(0, -1) })), (secret && { secret })), (endpoint.graphql &&
        endpoint.graphql.hostname && {
        graphqlHost: endpoint.graphql.hostname,
    })), (endpoint.graphql &&
        endpoint.graphql.port && { graphqlPort: endpoint.graphql.port }));
}
/**
 * FROM FAUNA SHEL: https://github.com/fauna/fauna-shell/blob/0fa47bdd8e2967c6ea957b13264646e80b98c227/src/lib/misc.js#L122
 * @param config
 * @param endpoint
 * @param alias
 * @param secret
 */
function saveEndpoint(config, endpoint, alias, secret) {
    var port = endpoint.port ? `:${endpoint.port}` : '';
    var uri = `${endpoint.protocol}//${endpoint.hostname}${port}`;
    var options = {
        method: 'HEAD',
        uri: uri,
        resolveWithFullResponse: true,
    };
    return (0, request_promise_1.default)(options)
        .then(function (res) {
        if ('x-faunadb-build' in res.headers) {
            return saveConfig(addEndpoint(config, endpoint, alias, secret));
        }
        else {
            throw new Error(`'${alias}' is not a FaunaDB endopoint`);
        }
    })
        .catch(function (err) {
        // Fauna returns a 401 which is an error for the request-promise library
        if (err.response !== undefined) {
            if ('x-faunadb-build' in err.response.headers) {
                return saveConfig(addEndpoint(config, endpoint, alias, secret));
            }
            else {
                throw new Error(`'${alias}' is not a FaunaDB endopoint`);
            }
        }
        else {
            throw err;
        }
    });
}
/**
 * Converts the `config` data provided to INI format, and then saves it to the
 * ~/.fauna-shell file.
 */
function saveConfig(config) {
    return writeFile(getConfigFile(), ini_1.default.stringify(config), '0o700');
}
/**
 * Wraps `fs.writeFile` into a Promise.
 */
function writeFile(fileName, data, mode) {
    return new Promise(function (resolve, reject) {
        fs_1.default.writeFile(fileName, data, { mode: mode }, (err) => {
            err ? reject(err) : resolve(data);
        });
    });
}
/**
 * FROM FAUNA SHELL: https://github.com/fauna/fauna-shell/blob/0fa47bdd8e2967c6ea957b13264646e80b98c227/src/lib/misc.js#L30
 * Takes a parsed endpointURL, an endpoint alias, and the endpoint secret,
 * and saves it to the .ini config file.
 *
 * - If the endpoint already exists, it will be overwritten, after asking confirmation
 *   from the user.
 * - If no other endpoint exists, then the endpoint will be set as the default one.
 */
function saveEndpointOrError(newEndpoint, alias, secret, overwrite = true) {
    return loadEndpoints().then(function (endpoints) {
        if (endpointExists(endpoints, alias)) {
            return overwrite ? saveEndpoint(endpoints, newEndpoint, alias, secret) : endpoints[alias];
        }
        else {
            return saveEndpoint(endpoints, newEndpoint, alias, secret);
        }
    });
}
exports.saveEndpointOrError = saveEndpointOrError;
/**
 * Gets endpoints. Typesafe mapping of load endpoints.
 * @returns
 */
const getEndpoints = () => __awaiter(void 0, void 0, void 0, function* () {
    const endpointLoad = yield loadEndpoints();
    return Object.keys(endpointLoad).reduce((map, key) => {
        const entry = endpointLoad[key];
        return Object.assign(Object.assign({}, map), (entry.port && entry.domain && entry.secret && entry) ?
            {
                [key]: Object.assign(Object.assign({}, entry), { alias: key })
            } : {});
    }, {});
});
exports.getEndpoints = getEndpoints;
/**
 * Finds a localhost endpoint. Matches the scheme and port if provided.
 * @param filter
 * @returns
 */
const findLocalHostEndpoint = (filter) => __awaiter(void 0, void 0, void 0, function* () {
    const endpoints = yield (0, exports.getEndpoints)();
    return Object.keys(endpoints).reduce((endpointResult, key) => {
        const endpoint = endpoints[key];
        return !filter || (filter && ((!filter.port || filter.port === endpoint.port) &&
            (!filter.scheme || filter.scheme === endpoint.scheme))) && endpoint.domain === LocalHost ? endpoint : endpointResult;
    }, undefined);
});
exports.findLocalHostEndpoint = findLocalHostEndpoint;
const createLocalHostEndpoint = (endpoint) => __awaiter(void 0, void 0, void 0, function* () {
    return yield saveEndpointOrError(Object.assign(Object.assign({}, endpoint), { domain: LocalHost }), endpoint.alias, endpoint.secret);
});
exports.createLocalHostEndpoint = createLocalHostEndpoint;
exports.FaunaEndpointStore = {
    used: {}
};
/**
 * Adds a Fauna endpoint to the store.
 * @param endpoint
 */
const addEndpointToUsed = (endpoint) => {
    exports.FaunaEndpointStore.used = Object.assign(Object.assign({}, exports.FaunaEndpointStore.used), { [endpoint.alias]: endpoint });
};
exports.addEndpointToUsed = addEndpointToUsed;
/**
 * Gets a matching localhost endpoint or creates one on the fly.
 * @param args
 * @returns
 */
const _FaunaEndpoint = (args) => __awaiter(void 0, void 0, void 0, function* () {
    return (yield (0, exports.findLocalHostEndpoint)(args)) || (yield (0, exports.createLocalHostEndpoint)(Object.assign({ port: exports.DeafultPort, scheme: exports.DefaultScheme, secret: (0, shortid_1.generate)(), alias: (0, shortid_1.generate)() }, args)));
});
exports._FaunaEndpoint = _FaunaEndpoint;
/**
 * Gets a localhost fauna endpoint and adds it to args.
 * @param args
 */
const FaunaEndpoint = (args) => __awaiter(void 0, void 0, void 0, function* () {
    const endpoint = yield (0, exports._FaunaEndpoint)(args);
    (0, exports.addEndpointToUsed)(endpoint);
    return endpoint;
});
exports.FaunaEndpoint = FaunaEndpoint;
const tearDownFaunaEndpointsOnMachine = () => __awaiter(void 0, void 0, void 0, function* () {
    yield saveConfig({});
});
exports.tearDownFaunaEndpointsOnMachine = tearDownFaunaEndpointsOnMachine;
const tearDownUsedFaunaEndponts = () => __awaiter(void 0, void 0, void 0, function* () {
    const endpoints = yield (0, exports.getEndpoints)();
    const config = yield loadEndpoints();
    yield Promise.all(Object.keys(exports.FaunaEndpointStore.used).map((endpointKey) => __awaiter(void 0, void 0, void 0, function* () {
        yield deleteEndpoint(config, exports.FaunaEndpointStore.used[endpointKey].alias);
    })));
});
exports.tearDownUsedFaunaEndponts = tearDownUsedFaunaEndponts;
/**
 *
 */
const tearDownFaunaEndpoints = (all) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, exports.tearDownUsedFaunaEndponts)();
    all && (yield (0, exports.tearDownFaunaEndpointsOnMachine)());
});
exports.tearDownFaunaEndpoints = tearDownFaunaEndpoints;
