import { Writable } from "stream";
import Docker from "dockerode";
import { generate } from "shortid";
export const FaunaDockerImage = "fauna/faunadb:latest";
export const FaunaDocker = "fauna/faunadb";
export const FaunaName = "faunadb";
export const ReadyMatch = /FaunaDB is ready./;
export const IdentificationMatch = /Identified as/;
export const DefaultPort = 8443;
/**
 * The MainStream. Will be used to catch errors from Fauna containers
 * started or used during the the running of the application.
 */
export const MainStream = new Writable();
/**
 * On error in pipe, the MainStream will throw an error.
 */
MainStream.on("error", (error) => {
    throw new Error("Output from a FaunaDB Docker pipe indicates an error has occurred.");
});
/**
 * The _write method for the MainStream.
 * In v0.1.0 is just the default.
 * @param chunk
 * @param encoding
 * @param done
 */
MainStream._write = (chunk, encoding, done) => {
    done();
};
/**
 * Parses a string input to deteremine whether the FaunaContainer is ready.
 * @param out is the pipe output.
 * @returns
 */
export const isReady = (out) => {
    return (out.match(ReadyMatch)?.length || 0) > 0;
};
export const isIdentified = (out) => {
    return (out.match(IdentificationMatch)?.length || 0) > 0;
};
/**
 * Whether or not a Fauna Docker container already exists.
 * @param docker
 * @returns
 */
export const faunaExists = async (docker) => {
    const images = await docker.listImages();
    ;
    const matches = images.filter((image) => {
        return image.RepoTags ? image.RepoTags.includes(FaunaDockerImage) : false;
    });
    return matches.length > 0;
};
/** Stores state used by container attachers and the like. */
export const ContainerStore = {
    available: undefined,
    used: {}
};
/**
 * Attaches to a Fauna Container and sets up steam events.
 * @param pkg is FaunaContainer without a stream. We will attach to the stream herein.
 * @returns
 */
export const attachToFaunaContainer = async (pkg) => {
    const stream = await pkg.container.attach({
        hijack: true,
        stderr: true,
        sdtin: true,
        stdout: true,
        stream: true
    });
    stream.pipe(MainStream);
    let clusterIsIdentified = false;
    return new Promise((resolve, reject) => {
        stream.on('data', (data) => {
            const response = data && data.toString();
            if (isReady(response) && clusterIsIdentified) {
                resolve({
                    ...pkg,
                    stream: stream
                });
            }
            if (isIdentified(response)) {
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
};
/**
 * Checks the machine for an availble Fauna container.
 * @returns
 */
export const getAvailableFaunaContainerFromMachine = async () => {
    const docker = new Docker();
    const containers = await docker.listContainers();
    const fauna = containers.filter((container) => {
        return container.Labels.fauna === FaunaName && container.State === "running";
    });
    console.log(fauna);
    const container = fauna.length ? docker.getContainer(fauna[0].Id) : undefined;
    if (!container) {
        return undefined;
    }
    const containerInfo = fauna[0];
    const stream = await container.attach({
        hijack: true,
        stderr: true,
        sdtin: true,
        stdout: true,
        stream: true
    });
    stream.pipe(MainStream);
    return {
        docker: docker,
        container: container,
        image: FaunaDocker,
        name: containerInfo.Names[0],
        stream: stream
    };
};
/**
 * Gets an available Fauna container based on the options provided by the user.
 * @param options represents whether or not the user wants to use an avalable container
 * and whether the available container can be retrieved from the machine.
 * @returns
 */
export const getAvailableFaunaContainer = async (options) => {
    return options && options.useAvailable !== false ? (options.useMachine !== false ?
        ContainerStore.available || await getAvailableFaunaContainerFromMachine()
        : ContainerStore.available) : undefined;
};
/**
 * Adds a container to used in the ContainerStore.
 * @param container
 */
export const addToUsedContainers = (container) => {
    ContainerStore.used[container.name] = container;
};
/**
 * Createa a FaunaContainer.
 * @param options
 * @returns
 */
export const _FaunaContainer = async (options) => {
    const availableContainer = await getAvailableFaunaContainer(options);
    if (availableContainer)
        return availableContainer;
    const docker = new Docker();
    if (!await faunaExists(docker)) {
        await docker.pull(FaunaDocker);
    }
    const name = `${FaunaName}-${generate()}`;
    const container = await docker.createContainer({
        Image: FaunaDocker,
        name: name,
        Labels: {
            fauna: FaunaName
        },
        ...options
    });
    const out = attachToFaunaContainer({
        docker: docker,
        container: container,
        image: FaunaDocker,
        name: name
    });
    await container.start();
    return out;
};
/**
 * Creates a FaunaContainer and adds it to used.
 * @param options
 */
export const FaunaContainer = async (options) => {
    const faunaContainer = await _FaunaContainer(options);
    addToUsedContainers(faunaContainer);
    return faunaContainer;
};
/**
 * Tears down a Fauna container.
 * @param container
 */
export const tearDownFaunaContainer = async (container) => {
    await container.stop({
        force: true
    });
    await container.remove({
        force: true
    });
};
/**
 * Tears down FaunaContainers on the machine.
 */
export const tearDownMachineContainers = async () => {
    const docker = new Docker();
    const containers = await docker.listContainers();
    await Promise.all(containers.filter((container) => {
        return container.Image === FaunaDockerImage;
    }).map(async (container) => {
        const _container = await docker.getContainer(container.Id);
        await tearDownFaunaContainer(_container);
    }));
};
/**
 * Tears down containers in used.
 */
export const tearDownUsedContainers = async () => {
    await Promise.all(Object.keys(ContainerStore.used).map(async (containerName) => {
        await tearDownFaunaContainer(ContainerStore.used[containerName].container);
        const { [containerName]: container, ...rest } = ContainerStore.used;
        ContainerStore.used = rest;
    }));
};
/**
 * Tears down Fauna containers.
 * @param all whether to TearDown containers beyond those used in the context of application.
 */
export const tearDownFaunaContainers = async (all = false) => {
    await tearDownUsedContainers();
    all && tearDownMachineContainers();
};
