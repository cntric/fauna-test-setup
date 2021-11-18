/// <reference types="node" />
import { Writable } from "stream";
import Docker, { Container } from "dockerode";
export declare const FaunaDockerImage = "fauna/faunadb:latest";
export declare const FaunaDocker = "fauna/faunadb";
export declare const FaunaName = "faunadb";
export declare const ReadyMatch: RegExp;
export declare const IdentificationMatch: RegExp;
export declare const DefaultPort = 8443;
/**
 * The MainStream. Will be used to catch errors from Fauna containers
 * started or used during the the running of the application.
 */
export declare const MainStream: Writable;
/**
 * Parses a string input to deteremine whether the FaunaContainer is ready.
 * @param out is the pipe output.
 * @returns
 */
export declare const isReady: (out: string) => boolean;
export declare const isIdentified: (out: string) => boolean;
/**
 * Whether or not a Fauna Docker container already exists.
 * @param docker
 * @returns
 */
export declare const faunaExists: (docker: Docker) => Promise<boolean>;
export interface FaunaContainerI {
    docker: Docker;
    container: Container;
    image: string;
    name: string;
    /** Streams emitted by the attached container. */
    stream: NodeJS.ReadWriteStream;
}
/** Stores state used by container attachers and the like. */
export declare const ContainerStore: {
    available: undefined | FaunaContainerI;
    used: {
        [key: string]: FaunaContainerI;
    };
};
/**
 * Attaches to a Fauna Container and sets up steam events.
 * @param pkg is FaunaContainer without a stream. We will attach to the stream herein.
 * @returns
 */
export declare const attachToFaunaContainer: (pkg: Omit<FaunaContainerI, "stream">) => Promise<FaunaContainerI>;
/**
 * Checks the machine for an availble Fauna container.
 * @returns
 */
export declare const getAvailableFaunaContainerFromMachine: () => Promise<FaunaContainerI | undefined>;
/**
 * Gets an available Fauna container based on the options provided by the user.
 * @param options represents whether or not the user wants to use an avalable container
 * and whether the available container can be retrieved from the machine.
 * @returns
 */
export declare const getAvailableFaunaContainer: (options?: {
    useAvailable?: boolean | undefined;
    useMachine?: boolean | undefined;
} | undefined) => Promise<undefined | FaunaContainerI>;
/**
 * Adds a container to used in the ContainerStore.
 * @param container
 */
export declare const addToUsedContainers: (container: FaunaContainerI) => void;
export declare type FaunaContainerArgsI = Docker.ContainerCreateOptions & {
    useAvailable?: boolean;
    useMachine?: boolean;
};
/**
 * Createa a FaunaContainer.
 * @param options
 * @returns
 */
export declare const _FaunaContainer: (options?: FaunaContainerArgsI | undefined) => Promise<FaunaContainerI>;
/**
 * Creates a FaunaContainer and adds it to used.
 * @param options
 */
export declare const FaunaContainer: (options?: (Docker.ContainerCreateOptions & {
    useAvailable?: boolean | undefined;
    useMachine?: boolean | undefined;
}) | undefined) => Promise<FaunaContainerI>;
/**
 * Tears down a Fauna container.
 * @param container
 */
export declare const tearDownFaunaContainer: (container: Container) => Promise<void>;
/**
 * Tears down FaunaContainers on the machine.
 */
export declare const tearDownMachineContainers: () => Promise<void>;
/**
 * Tears down containers in used.
 */
export declare const tearDownUsedContainers: () => Promise<void>;
/**
 * Tears down Fauna containers.
 * @param all whether to TearDown containers beyond those used in the context of application.
 */
export declare const tearDownFaunaContainers: (all?: boolean) => Promise<void>;
