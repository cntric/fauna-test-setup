import { Client } from "faunadb";
import { FaunaEndpointI } from "./faunaEndpoints";
import { FaunaContainerArgsI, FaunaContainerI } from "./launchFauna";
export declare const DefaultPort = 8443;
export declare const TestPrefix = "fauna-test";
export interface FaunaTestDbI {
    container: FaunaContainerI;
    endpoint: FaunaEndpointI;
    name: string;
    client: Client;
}
export declare type FaunaTestDbArgsI = Partial<{
    port: number;
    scheme: "http" | "https";
    secret: string;
    name: string;
    useContainer: "new" | "used" | "machine";
}>;
export declare const interprePort: (args?: Partial<{
    port: number;
    scheme: "http" | "https";
    secret: string;
    name: string;
    useContainer: "new" | "used" | "machine";
}> | undefined) => number;
export declare const interpretContainerArgs: (args?: Partial<{
    port: number;
    scheme: "http" | "https";
    secret: string;
    name: string;
    useContainer: "new" | "used" | "machine";
}> | undefined) => FaunaContainerArgsI;
export declare const FaunaDatabaseStore: {
    used: {
        [key: string]: FaunaTestDbI;
    };
};
export declare const ShellLikeClient: (endpoint: FaunaEndpointI) => Client;
export declare const _FaunaTestDb: (args?: Partial<{
    port: number;
    scheme: "http" | "https";
    secret: string;
    name: string;
    useContainer: "new" | "used" | "machine";
}> | undefined) => Promise<FaunaTestDbI>;
export declare const FaunaTestDb: (args?: Partial<{
    port: number;
    scheme: "http" | "https";
    secret: string;
    name: string;
    useContainer: "new" | "used" | "machine";
}> | undefined) => Promise<FaunaTestDbI>;
export declare const tearDownAllFaunaTestDbsOnClient: (client: Client) => Promise<object>;
export declare const tearDownAllFaunaTestDbsOnEndpoint: (endpoint: FaunaEndpointI) => Promise<object>;
export declare const tearDownFaunaTestDb: (db: FaunaTestDbI) => Promise<object>;
export declare const tearDownAllTestDbs: () => Promise<void[]>;
export declare const tearDownTestDbsOnAllUsedEndpoints: () => Promise<void[]>;
export declare const tearDownUsedTestDbs: () => Promise<void[]>;
export declare const teardownFaunaTestDbs: (mode?: "used" | "endpoints" | "all") => Promise<void[] | undefined>;
export declare type FaunaTeardownArgsI = Partial<{
    dbs: "used" | "endpoints" | "all";
    endpoints: "used" | "all";
    containers: "used" | "all";
}>;
export declare const DefaultTeardownArgs: FaunaTeardownArgsI;
export declare const teardown: (args?: FaunaTeardownArgsI) => Promise<void[] | undefined>;
