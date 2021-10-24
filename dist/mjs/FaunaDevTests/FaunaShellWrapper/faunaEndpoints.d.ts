export declare const DeafultPort = 8443;
export declare const DefaultScheme: "http";
export declare type _FaunaInputEndpointI = Partial<{
    port: number;
    hostname: string;
    protocol: string;
    graphql: {
        port: number;
        hostname: string;
        protocol: string;
    };
}>;
export declare type _FaunaEndpointI = Partial<{
    port: number;
    scheme: "http" | "https";
    domain: string;
    secret: string;
}>;
export declare type FaunaConfigI = {
    default?: string;
} & {
    [key: string]: _FaunaEndpointI;
};
export interface FaunaEndpointI {
    port: number;
    domain: string;
    scheme: "http" | "https";
    secret: string;
    alias: string;
}
/**
 * FROM FAUNA SHELL: https://github.com/fauna/fauna-shell/blob/0fa47bdd8e2967c6ea957b13264646e80b98c227/src/lib/misc.js#L224
 * Wraps `fs.readFile` into a Promise.
 */
export declare function readFile(fileName: string): Promise<string>;
/**
 * FROM FAUNA SHELL: https://github.com/fauna/fauna-shell/blob/0fa47bdd8e2967c6ea957b13264646e80b98c227/src/lib/misc.js#L217
 * Returns the full path to the `.fauna-shell` config file
 */
export declare function getConfigFile(): string;
/**
 * FROM FAUNA SHELL: https://github.com/fauna/fauna-shell/blob/0fa47bdd8e2967c6ea957b13264646e80b98c227/src/lib/misc.js#L246
 * Tests if an error is of the type "file not found".
 */
export declare function fileNotFound(err: any): boolean;
/**
 * FROM FAUNA SHELL: https://github.com/fauna/fauna-shell/blob/0fa47bdd8e2967c6ea957b13264646e80b98c227/src/lib/misc.js#L109
 * Loads the endpoints from the ~/.fauna-shell file.
 * If the file doesn't exist, returns an empty object.
 */
export declare function loadEndpoints(): Promise<FaunaConfigI>;
/**
 * FROM FAUNA SHELL: https://github.com/fauna/fauna-shell/blob/0fa47bdd8e2967c6ea957b13264646e80b98c227/src/lib/misc.js#L30
 * Takes a parsed endpointURL, an endpoint alias, and the endpoint secret,
 * and saves it to the .ini config file.
 *
 * - If the endpoint already exists, it will be overwritten, after asking confirmation
 *   from the user.
 * - If no other endpoint exists, then the endpoint will be set as the default one.
 */
export declare function saveEndpointOrError(newEndpoint: _FaunaEndpointI, alias: string, secret: string, overwrite?: boolean): Promise<FaunaEndpointI>;
/**
 * Gets endpoints. Typesafe mapping of load endpoints.
 * @returns
 */
export declare const getEndpoints: () => Promise<{
    [key: string]: FaunaEndpointI;
}>;
/**
 * Finds a localhost endpoint. Matches the scheme and port if provided.
 * @param filter
 * @returns
 */
export declare const findLocalHostEndpoint: (filter?: {
    port?: number | undefined;
    scheme?: string | undefined;
} | undefined) => Promise<FaunaEndpointI | undefined>;
export interface FaunaInputEndpointI {
    port: number;
    scheme: "http" | "https";
    secret: string;
    alias: string;
}
export declare const createLocalHostEndpoint: (endpoint: FaunaInputEndpointI) => Promise<FaunaEndpointI>;
export declare const FaunaEndpointStore: {
    used: {
        [key: string]: FaunaEndpointI;
    };
};
/**
 * Adds a Fauna endpoint to the store.
 * @param endpoint
 */
export declare const addEndpointToUsed: (endpoint: FaunaEndpointI) => void;
export interface FaunaEndpointArgsI {
    port?: number;
    secret?: string;
    scheme?: string;
}
/**
 * Gets a matching localhost endpoint or creates one on the fly.
 * @param args
 * @returns
 */
export declare const _FaunaEndpoint: (args?: FaunaEndpointArgsI | undefined) => Promise<FaunaEndpointI>;
/**
 * Gets a localhost fauna endpoint and adds it to args.
 * @param args
 */
export declare const FaunaEndpoint: (args?: FaunaEndpointArgsI | undefined) => Promise<FaunaEndpointI>;
export declare const tearDownFaunaEndpointsOnMachine: () => Promise<void>;
export declare const tearDownUsedFaunaEndponts: () => Promise<void>;
/**
 *
 */
export declare const tearDownFaunaEndpoints: (all?: boolean | undefined) => Promise<void>;
