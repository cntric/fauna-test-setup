import {execSync} from "child_process";
import {Client, query} from "faunadb";
import { generate } from "shortid";
import { FaunaEndpointI, FaunaEndpoint, FaunaEndpointArgsI, getEndpoints, tearDownFaunaEndpoints} from "./faunaEndpoints";
import { FaunaContainer, FaunaContainerArgsI, FaunaContainerI, tearDownFaunaContainers } from "./launchFauna";

export const DefaultPort = 8443;
export const TestPrefix = "fauna-test";

const {
    CreateDatabase,
    Databases,
    Delete,
    Map,
    StartsWith,
    Lambda,
    Paginate,
    Filter,
    Select,
    Var,
    Get,
    Database
} = query;

export interface FaunaTestDbI {
    container : FaunaContainerI,
    endpoint : FaunaEndpointI,
    name : string,
    client : Client
}

export type FaunaTestDbArgsI = Partial<{
    port : number, 
    scheme : "http" | "https", 
    secret : string
    name : string,
    useContainer : "new" | "used" | "machine",
}>

export const interprePort = (args ? : FaunaTestDbArgsI) : number =>{
    return args && args.port ? args.port : DefaultPort;
}

export const interpretContainerArgs = (args ? : FaunaTestDbArgsI) : FaunaContainerArgsI =>{
    
    const port = interprePort(args);

    return {
        HostConfig : {
            PortBindings : {
                [`${port}/tcp`] : [{
                    HostPort : `${port}`
                }] 
            }
        },
        useAvailable : args && args.useContainer ? args.useContainer !== "new" : true,
        useMachine : args && args.useContainer ? args.useContainer !== "machine" : true
    }

}

export const FaunaDatabaseStore : {
    used : {
        [key : string] : FaunaTestDbI
    }
} = {
    used : {}
}

export const ShellLikeClient = (endpoint : FaunaEndpointI)=>{

    return new Client({
        secret : endpoint.secret,
        port : endpoint.port,
        scheme : endpoint.scheme,
        domain : endpoint.domain,
        headers : {
            'X-Fauna-Soucre' : 'Fauna Shell'
        }
    });

}

export const _FaunaTestDb = async (args ? : FaunaTestDbArgsI) : Promise<FaunaTestDbI> =>{

    const _args : FaunaTestDbArgsI = {
        ...args,
        port : interprePort(args)
    }

    const containerArgs = interpretContainerArgs(_args);
    const container = await FaunaContainer(containerArgs);

    const endpoint = await FaunaEndpoint(args);


    
    const client = new Client({
        secret : endpoint.secret,
        port : endpoint.port,
        scheme : endpoint.scheme,
        domain : endpoint.domain
    });

    const name = args && args.name ? `${TestPrefix}-$` : `${TestPrefix}-${generate()}`;
    
    await client.query(
        CreateDatabase({
            name : name
        })
    )

    return {
        container : container,
        endpoint : endpoint,
        name : name,
        client : client
    }   

}


export const FaunaTestDb = async (args ? : FaunaTestDbArgsI) : Promise<FaunaTestDbI> =>{

    const db = await _FaunaTestDb(args);
    FaunaDatabaseStore.used = {
        ...FaunaDatabaseStore.used,
        [db.name] : db
    }
    return db;

}

export const tearDownAllFaunaTestDbsOnClient = async (client : Client)=>{

   return await client.query(
        Map(
            Filter(
                Paginate(Databases()),
                Lambda(
                    ["dbRef"],
                    StartsWith(
                        TestPrefix,
                        Select("name", Get(Var("dbRef")))
                    )
                )
            ),
            Lambda(
                ["dbRef"],
                Delete(Var("dbRef"))
            )
        )
    )

}

export const tearDownAllFaunaTestDbsOnEndpoint = async (endpoint : FaunaEndpointI)=>{

    const client = ShellLikeClient(endpoint);
    return await tearDownAllFaunaTestDbsOnClient(client);

}

export const tearDownFaunaTestDb = async (db : FaunaTestDbI)=>{

    const client = ShellLikeClient(db.endpoint);

    return await client.query(
        Delete(
            Database(db.name)
        )
    )
}

export const tearDownAllTestDbs = async ()=>{
    const endpoints = await getEndpoints();
    return await Promise.all(Object.values(endpoints).map(async (endpoint)=>{
        tearDownAllFaunaTestDbsOnEndpoint(endpoint);
    }))
}

export const tearDownTestDbsOnAllUsedEndpoints = async ()=>{
    const endpoints = Object.values(Object.values(FaunaDatabaseStore.used).reduce((map, db)=>{
        return {
            ...map,
            [db.endpoint.alias] : db.endpoint
        }
    }, {})) as FaunaEndpointI[]
    return await Promise.all(Object.values(endpoints).map(async (endpoint)=>{
        tearDownAllFaunaTestDbsOnEndpoint(endpoint);
    }))
}

export const tearDownUsedTestDbs = async ()=>{

    return await Promise.all(Object.values(FaunaDatabaseStore.used).map(async (db)=>{
        await tearDownFaunaTestDb(db);
    }));  
}

export const teardownFaunaTestDbs = async (mode : "used" | "endpoints" | "all" = "used")=>{

    switch(mode){

        case "used" : {
            return await tearDownUsedTestDbs();
        }

        case "endpoints" : {
            return await tearDownTestDbsOnAllUsedEndpoints()
        }

        case "all" : {
            return await tearDownAllTestDbs()
        }

        default : {
            await tearDownUsedTestDbs();
        }

    }

}

export type FaunaTeardownArgsI  = Partial<{
    dbs : "used" | "endpoints" | "all",
    endpoints : "used" | "all",
    containers : "used" | "all"
}>

export const DefaultTeardownArgs : FaunaTeardownArgsI = {
    dbs : "used"
}

export const teardown = async (args : FaunaTeardownArgsI = DefaultTeardownArgs)=>{

    const result = await teardownFaunaTestDbs(args.dbs || "used");

    args.endpoints && await tearDownFaunaEndpoints(args.endpoints === "all");

    args.containers && await tearDownFaunaContainers(args.containers === "all");

    return result;

}