import {execSync} from "child_process";
import {Client} from "faunadb";
import fs from "fs";
import os from "os";
import path from "path";
import ini from "ini";
import rp from "request-promise"
import { generate } from "shortid";

const LocalHost = "localhost";
export const DeafultPort = 8443;
export const DefaultScheme : "http" = "http" as const;

const FAUNA_CLOUD_DOMAIN = 'db.fauna.com'
const ERROR_NO_DEFAULT_ENDPOINT =
  "You need to set a default endpoint. \nTry running 'fauna default-endpoint ENDPOINT_ALIAS'."
const ERROR_WRONG_CLOUD_ENDPOINT =
  "You already have an endpoint 'cloud' defined and it doesn't point to 'db.fauna.com'.\nPlease fix your '~/.fauna-shell' file."
const ERROR_SPECIFY_SECRET_KEY =
  'You must specify a secret key to connect to FaunaDB'

export type _FaunaInputEndpointI = Partial<{
    port : number
    hostname : string
    protocol : string,
    graphql : {
        port : number
        hostname : string
        protocol : string,
    }
}>


export type _FaunaEndpointI = Partial<{
    port : number,
    scheme : "http" | "https"
    domain : string,
    secret : string
}>

export type FaunaConfigI = {
    default? : string
} & {

    [key : string] : _FaunaEndpointI
}

export interface FaunaEndpointI {
    port : number,
    domain : string,
    scheme : "http" | "https",
    secret : string,
    alias : string
}

/**
 * FROM FAUNA SHELL: https://github.com/fauna/fauna-shell/blob/0fa47bdd8e2967c6ea957b13264646e80b98c227/src/lib/misc.js#L224
 * Wraps `fs.readFile` into a Promise.
 */
export function readFile(fileName : string) : Promise<string> {
    return new Promise(function (resolve, reject) {
        fs.readFile(fileName, 'utf8', (err, data) => {
            err ? reject(err) : resolve(data)
        })
    })
}

/**
 * FROM FAUNA SHELL: https://github.com/fauna/fauna-shell/blob/0fa47bdd8e2967c6ea957b13264646e80b98c227/src/lib/misc.js#L217
 * Returns the full path to the `.fauna-shell` config file
 */
export function getConfigFile() : string {
    return path.join(os.homedir(), '.fauna-shell')
}

/**
 * FROM FAUNA SHELL: https://github.com/fauna/fauna-shell/blob/0fa47bdd8e2967c6ea957b13264646e80b98c227/src/lib/misc.js#L246
 * Tests if an error is of the type "file not found".
 */
export function fileNotFound(err : any) {
    return err.code === 'ENOENT' && err.syscall === 'open'
}

/**
 * FROM FAUNA SHELL: https://github.com/fauna/fauna-shell/blob/0fa47bdd8e2967c6ea957b13264646e80b98c227/src/lib/misc.js#L109
 * Loads the endpoints from the ~/.fauna-shell file.
 * If the file doesn't exist, returns an empty object.
 */
export function loadEndpoints() : Promise<FaunaConfigI> {
    return readFile(getConfigFile())
        .then(function (configData) {
        return ini.parse(configData)
        })
        .catch(function (err) {
        if (fileNotFound(err)) {
            return {}
        }
            throw err
        }) as Promise<FaunaConfigI>
}



/**
 * FROM FAUNA SHELL: https://github.com/fauna/fauna-shell/blob/0fa47bdd8e2967c6ea957b13264646e80b98c227/src/lib/misc.js#L122
 * @param endpoints
 * @param endpointAlias 
 * @returns 
 */
function endpointExists(endpoints : FaunaConfigI, endpointAlias : string) {
    return endpointAlias in endpoints
}

/**
 * FROM FAUNA SHELL: https://github.com/fauna/fauna-shell/blob/0fa47bdd8e2967c6ea957b13264646e80b98c227/src/lib/misc.js#L167
 * @param config 
 * @param endpoint 
 * @param alias 
 * @param secret 
 * @returns 
 */
function addEndpoint(
    config : FaunaConfigI, 
    endpoint : _FaunaInputEndpointI, 
    alias : string, 
    secret : string
) {
    if (shouldSetAsDefaultEndpoint(config)) {
      config.default = alias
    }
    config[alias] = buildEndpointObject(endpoint, secret)
    return config
  }

/**
 * 
 * @param endpoints 
 * @param alias 
 * @returns 
 */
function deleteEndpoint(endpoints : FaunaConfigI, alias : string) {
    if (endpoints.default === alias) {
      delete endpoints.default
    }
    delete endpoints[alias]
    return saveConfig(endpoints)
  }
  
  function shouldSetAsDefaultEndpoint(config : FaunaConfigI) {
    return 'default' in config === false
  }
  
  function buildEndpointObject(endpoint : _FaunaInputEndpointI, secret : string) : _FaunaEndpointI {
    return {
      ...(endpoint.hostname && { domain: endpoint.hostname }),
      ...(endpoint.port && { port: endpoint.port }),
      ...(endpoint.protocol && { scheme: endpoint.protocol.slice(0, -1) as "http" | "https" }),
      ...(secret && { secret }),
      ...(endpoint.graphql &&
        endpoint.graphql.hostname && {
          graphqlHost: endpoint.graphql.hostname,
        }),
      ...(endpoint.graphql &&
        endpoint.graphql.port && { graphqlPort: endpoint.graphql.port }),
    }
  }
  

/**
 * FROM FAUNA SHEL: https://github.com/fauna/fauna-shell/blob/0fa47bdd8e2967c6ea957b13264646e80b98c227/src/lib/misc.js#L122
 * @param config 
 * @param endpoint 
 * @param alias 
 * @param secret 
 */
 function saveEndpoint(
     config : FaunaConfigI, 
     endpoint : _FaunaInputEndpointI, 
     alias : string, 
     secret : string
) : Promise<FaunaEndpointI> {
    var port = endpoint.port ? `:${endpoint.port}` : ''
    var uri = `${endpoint.protocol}//${endpoint.hostname}${port}`
    var options = {
      method: 'HEAD',
      uri: uri,
      resolveWithFullResponse: true,
    }
  
    return rp(options)
      .then(function (res) {
        if ('x-faunadb-build' in res.headers) {
          return saveConfig(addEndpoint(config, endpoint, alias, secret))
        } else {
          throw new Error(`'${alias}' is not a FaunaDB endopoint`)
        }
      })
      .catch(function (err) {
        // Fauna returns a 401 which is an error for the request-promise library
        if (err.response !== undefined) {
          if ('x-faunadb-build' in err.response.headers) {
            return saveConfig(addEndpoint(config, endpoint, alias, secret))
          } else {
            throw new Error(`'${alias}' is not a FaunaDB endopoint`)
          }
        } else {
          throw err
        }
      })
  }
  

/**
 * Converts the `config` data provided to INI format, and then saves it to the
 * ~/.fauna-shell file.
 */
 function saveConfig(config : FaunaConfigI) {
    return writeFile(getConfigFile(), ini.stringify(config), '0o700')
  }

/**
 * Wraps `fs.writeFile` into a Promise.
 */
function writeFile(fileName : string, data : string, mode : string) {
    return new Promise(function (resolve, reject) {
        fs.writeFile(fileName, data, { mode: mode }, (err) => {
        err ? reject(err) : resolve(data)
        })
    })
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
 export function saveEndpointOrError(
     newEndpoint : _FaunaEndpointI, 
     alias : string, 
     secret : string,
     overwrite : boolean = true
) : Promise<FaunaEndpointI> {
    return loadEndpoints().then(function (endpoints) {
      if (endpointExists(endpoints, alias)) {
        return overwrite ? saveEndpoint(endpoints, newEndpoint, alias, secret) : endpoints[alias] as FaunaEndpointI;
      } else {
        return saveEndpoint(endpoints, newEndpoint, alias, secret)
      }
    })
  }


/**
 * Gets endpoints. Typesafe mapping of load endpoints.
 * @returns 
 */
export const getEndpoints = async () : Promise<{
    [key : string] : FaunaEndpointI
}>=>{
    
    const endpointLoad = await loadEndpoints();

    return Object.keys(endpointLoad).reduce((map, key)=>{

        const entry = endpointLoad[key];
        return {
            ...map,
            ...(entry.port && entry.domain && entry.secret && entry) ? 
                {
                    [key] : {
                        ...entry,
                        alias : key
                    }
                } : {}
        }

    }, {})

}

/**
 * Finds a localhost endpoint. Matches the scheme and port if provided.
 * @param filter 
 * @returns 
 */
export const findLocalHostEndpoint = async (filter? : {
    port ? : number,
    scheme ? : string
}) : Promise<FaunaEndpointI | undefined>=>{

    const endpoints = await getEndpoints();
    return Object.keys(endpoints).reduce<FaunaEndpointI|undefined>((endpointResult, key)=>{
        
        const endpoint = endpoints[key];

        return !filter || (
            filter && (
                (!filter.port || filter.port === endpoint.port) &&
                (!filter.scheme || filter.scheme === endpoint.scheme)
            )
        ) && endpoint.domain === LocalHost ? endpoint : endpointResult;


    }, undefined)

}

export interface FaunaInputEndpointI {
    port : number, 
    scheme : "http" | "https",
    secret : string,
    alias : string,
}

export const createLocalHostEndpoint =  async (endpoint : FaunaInputEndpointI) : Promise<FaunaEndpointI> => {


    return await saveEndpointOrError(
        {
            ...endpoint,
            domain : LocalHost
        },
        endpoint.alias,
        endpoint.secret
    )

}

export const FaunaEndpointStore : {
    used : {
        [key : string] : FaunaEndpointI
    }
} = {

    used : {}
}

/**
 * Adds a Fauna endpoint to the store.
 * @param endpoint 
 */
 export const addEndpointToUsed = (endpoint : FaunaEndpointI)=>{
    FaunaEndpointStore.used = {
        ...FaunaEndpointStore.used,
        [endpoint.alias] : endpoint
    }
}

export interface FaunaEndpointArgsI {
    port? : number,
    secret? : string,
    scheme? : string
}

/**
 * Gets a matching localhost endpoint or creates one on the fly.
 * @param args 
 * @returns 
 */
export const _FaunaEndpoint = async (args? : FaunaEndpointArgsI) : Promise<FaunaEndpointI>=>{

    return await findLocalHostEndpoint(args) || await createLocalHostEndpoint({
        port : DeafultPort,
        scheme : DefaultScheme,
        secret : generate(),
        alias : generate(),
        ...args
    } as FaunaInputEndpointI)

}

/**
 * Gets a localhost fauna endpoint and adds it to args.
 * @param args 
 */
export const FaunaEndpoint = async (args? : FaunaEndpointArgsI)=>{

    const endpoint = await _FaunaEndpoint(args);
    addEndpointToUsed(endpoint);
    return endpoint;

}



export const tearDownFaunaEndpointsOnMachine =  async ()=>{

    await saveConfig({});

}

export const tearDownUsedFaunaEndponts = async ()=>{

    const endpoints = await getEndpoints();
    const config = await loadEndpoints();
    await Promise.all(Object.keys(FaunaEndpointStore.used).map(async (endpointKey)=>{
        await deleteEndpoint(config, FaunaEndpointStore.used[endpointKey].alias)
    }))

}

/**
 * 
 */
export const tearDownFaunaEndpoints = async (all ? : boolean)=>{

    await tearDownUsedFaunaEndponts();
    all && await tearDownFaunaEndpointsOnMachine()

}