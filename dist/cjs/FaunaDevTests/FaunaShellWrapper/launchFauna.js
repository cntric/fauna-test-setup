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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tearDownFaunaContainers = exports.tearDownUsedContainers = exports.tearDownMachineContainers = exports.tearDownFaunaContainer = exports.FaunaContainer = exports._FaunaContainer = exports.addToUsedContainers = exports.getAvailableFaunaContainer = exports.getAvailableFaunaContainerFromMachine = exports.attachToFaunaContainer = exports.ContainerStore = exports.faunaExists = exports.isIdentified = exports.isReady = exports.MainStream = exports.DefaultPort = exports.IdentificationMatch = exports.ReadyMatch = exports.FaunaName = exports.FaunaDocker = exports.FaunaDockerImage = void 0;
const stream_1 = require("stream");
const dockerode_1 = __importDefault(require("dockerode"));
const shortid_1 = require("shortid");
exports.FaunaDockerImage = "fauna/faunadb:latest";
exports.FaunaDocker = "fauna/faunadb";
exports.FaunaName = "faunadb";
exports.ReadyMatch = /FaunaDB is ready./;
exports.IdentificationMatch = /Identified as/;
exports.DefaultPort = 8443;
/**
 * The MainStream. Will be used to catch errors from Fauna containers
 * started or used during the the running of the application.
 */
exports.MainStream = new stream_1.Writable();
/**
 * On error in pipe, the MainStream will throw an error.
 */
exports.MainStream.on("error", (error) => {
    throw new Error("Output from a FaunaDB Docker pipe indicates an error has occurred.");
});
/**
 * The _write method for the MainStream.
 * In v0.1.0 is just the default.
 * @param chunk
 * @param encoding
 * @param done
 */
exports.MainStream._write = (chunk, encoding, done) => {
    done();
};
/**
 * Parses a string input to deteremine whether the FaunaContainer is ready.
 * @param out is the pipe output.
 * @returns
 */
const isReady = (out) => {
    var _a;
    return (((_a = out.match(exports.ReadyMatch)) === null || _a === void 0 ? void 0 : _a.length) || 0) > 0;
};
exports.isReady = isReady;
const isIdentified = (out) => {
    var _a;
    return (((_a = out.match(exports.IdentificationMatch)) === null || _a === void 0 ? void 0 : _a.length) || 0) > 0;
};
exports.isIdentified = isIdentified;
/**
 * Whether or not a Fauna Docker container already exists.
 * @param docker
 * @returns
 */
const faunaExists = (docker) => __awaiter(void 0, void 0, void 0, function* () {
    const images = yield docker.listImages();
    ;
    const matches = images.filter((image) => {
        return image.RepoTags ? image.RepoTags.includes(exports.FaunaDockerImage) : false;
    });
    return matches.length > 0;
});
exports.faunaExists = faunaExists;
/** Stores state used by container attachers and the like. */
exports.ContainerStore = {
    available: undefined,
    used: {}
};
/**
 * Attaches to a Fauna Container and sets up steam events.
 * @param pkg is FaunaContainer without a stream. We will attach to the stream herein.
 * @returns
 */
const attachToFaunaContainer = (pkg) => __awaiter(void 0, void 0, void 0, function* () {
    const stream = yield pkg.container.attach({
        hijack: true,
        stderr: true,
        sdtin: true,
        stdout: true,
        stream: true
    });
    stream.pipe(exports.MainStream);
    let clusterIsIdentified = false;
    return new Promise((resolve, reject) => {
        stream.on('data', (data) => {
            const response = data && data.toString();
            if ((0, exports.isReady)(response) && clusterIsIdentified) {
                resolve(Object.assign(Object.assign({}, pkg), { stream: stream }));
            }
            if ((0, exports.isIdentified)(response)) {
                clusterIsIdentified = true;
            }
        });
        stream.on('error', () => {
            reject();
        });
        stream.on('close', () => {
            reject();
        });
    });
});
exports.attachToFaunaContainer = attachToFaunaContainer;
/**
 * Checks the machine for an availble Fauna container.
 * @returns
 */
const getAvailableFaunaContainerFromMachine = () => __awaiter(void 0, void 0, void 0, function* () {
    const docker = new dockerode_1.default();
    const containers = yield docker.listContainers();
    const fauna = containers.filter((container) => {
        return container.Labels.fauna === exports.FaunaName && container.State === "running";
    });
    console.log(fauna);
    const container = fauna.length ? docker.getContainer(fauna[0].Id) : undefined;
    if (!container) {
        return undefined;
    }
    const containerInfo = fauna[0];
    const stream = yield container.attach({
        hijack: true,
        stderr: true,
        sdtin: true,
        stdout: true,
        stream: true
    });
    stream.pipe(exports.MainStream);
    return {
        docker: docker,
        container: container,
        image: exports.FaunaDocker,
        name: containerInfo.Names[0],
        stream: stream
    };
});
exports.getAvailableFaunaContainerFromMachine = getAvailableFaunaContainerFromMachine;
/**
 * Gets an available Fauna container based on the options provided by the user.
 * @param options represents whether or not the user wants to use an avalable container
 * and whether the available container can be retrieved from the machine.
 * @returns
 */
const getAvailableFaunaContainer = (options) => __awaiter(void 0, void 0, void 0, function* () {
    return options && options.useAvailable !== false ? (options.useMachine !== false ?
        exports.ContainerStore.available || (yield (0, exports.getAvailableFaunaContainerFromMachine)())
        : exports.ContainerStore.available) : undefined;
});
exports.getAvailableFaunaContainer = getAvailableFaunaContainer;
/**
 * Adds a container to used in the ContainerStore.
 * @param container
 */
const addToUsedContainers = (container) => {
    exports.ContainerStore.used[container.name] = container;
};
exports.addToUsedContainers = addToUsedContainers;
/**
 * Createa a FaunaContainer.
 * @param options
 * @returns
 */
const _FaunaContainer = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const availableContainer = yield (0, exports.getAvailableFaunaContainer)(options);
    if (availableContainer)
        return availableContainer;
    const docker = new dockerode_1.default();
    if (!(yield (0, exports.faunaExists)(docker))) {
        yield docker.pull(exports.FaunaDocker);
    }
    const name = `${exports.FaunaName}-${(0, shortid_1.generate)()}`;
    const container = yield docker.createContainer(Object.assign({ Image: exports.FaunaDocker, name: name, Labels: {
            fauna: exports.FaunaName
        } }, options));
    const out = (0, exports.attachToFaunaContainer)({
        docker: docker,
        container: container,
        image: exports.FaunaDocker,
        name: name
    });
    yield container.start();
    return out;
});
exports._FaunaContainer = _FaunaContainer;
/**
 * Creates a FaunaContainer and adds it to used.
 * @param options
 */
const FaunaContainer = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const faunaContainer = yield (0, exports._FaunaContainer)(options);
    (0, exports.addToUsedContainers)(faunaContainer);
    return faunaContainer;
});
exports.FaunaContainer = FaunaContainer;
/**
 * Tears down a Fauna container.
 * @param container
 */
const tearDownFaunaContainer = (container) => __awaiter(void 0, void 0, void 0, function* () {
    yield container.stop({
        force: true
    });
    yield container.remove({
        force: true
    });
});
exports.tearDownFaunaContainer = tearDownFaunaContainer;
/**
 * Tears down FaunaContainers on the machine.
 */
const tearDownMachineContainers = () => __awaiter(void 0, void 0, void 0, function* () {
    const docker = new dockerode_1.default();
    const containers = yield docker.listContainers();
    yield Promise.all(containers.filter((container) => {
        return container.Image === exports.FaunaDockerImage;
    }).map((container) => __awaiter(void 0, void 0, void 0, function* () {
        const _container = yield docker.getContainer(container.Id);
        yield (0, exports.tearDownFaunaContainer)(_container);
    })));
});
exports.tearDownMachineContainers = tearDownMachineContainers;
/**
 * Tears down containers in used.
 */
const tearDownUsedContainers = () => __awaiter(void 0, void 0, void 0, function* () {
    yield Promise.all(Object.keys(exports.ContainerStore.used).map((containerName) => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, exports.tearDownFaunaContainer)(exports.ContainerStore.used[containerName].container);
        const _a = exports.ContainerStore.used, _b = containerName, container = _a[_b], rest = __rest(_a, [typeof _b === "symbol" ? _b : _b + ""]);
        exports.ContainerStore.used = rest;
    })));
});
exports.tearDownUsedContainers = tearDownUsedContainers;
/**
 * Tears down Fauna containers.
 * @param all whether to TearDown containers beyond those used in the context of application.
 */
const tearDownFaunaContainers = (all = false) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, exports.tearDownUsedContainers)();
    all && (0, exports.tearDownMachineContainers)();
});
exports.tearDownFaunaContainers = tearDownFaunaContainers;
