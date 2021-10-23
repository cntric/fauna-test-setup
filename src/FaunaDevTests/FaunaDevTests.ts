import {execSync} from "child_process";
import {Client} from "faunadb";

let TestClient : undefined |  Client = undefined;
let TestClientError : undefined  | Error = undefined;

export const TestClientSecret = "DEV_SECRET";
export const TestClientEndpoint = 8443
export const TestClientPort = 8443;
export const TestDatabaseName ="test";

export const launchFauna = (args ? : {
    port? : number,
})=>{

    execSync(
        `docker run -d --rm --name faunadb -p ${(args && args.port) || TestClientPort}:${(args && args.port) || TestClientPort} fauna/faunadb`
    )

}

export const registerEndpoint = (args ? : {
    endpointPort? : number,
})=>{

    execSync(
        `fauna add-endpoint http://localhost:${args?.endpointPort || TestClientEndpoint} --alias localhost --key secret`
    )

}

export const removeDatabase = (args ? : {
    name ? : string
})=>{

    execSync(
        `fauna delete-database ${args?.name || TestDatabaseName}`
    )

}

export const createDatabase = (args ? : {
    name ? : string
})=>{

    execSync(
        `fauna create-database ${args?.name||TestDatabaseName} --endpoint=localhost`
    )

}

export const getDatabaseKey = (args? : {
    name ? : string
})=>{

    const out = execSync(
        `fauna create-key ${args?.name||TestDatabaseName} --endpoint=localhost`
    ).toString()
    const match = out.match(/secret: (\S+)\n/)
    const key = out.match(/secret/)

    console.log(match);

}

export const TestDatabase = (args ? : {
    port? : number,
    endpointPort? : number,
    secret? : string,
    name ? : string
})=>{


    /*execSync(
        `docker run -d --rm --name faunadb -p ${(args && args.port) || TestClientPort}:${(args && args.port) || TestClientPort} fauna/faunadb`,
    )*/

    execSync(
        `fauna add-endpoint http://localhost:${args?.endpointPort || TestClientEndpoint} --alias localhost --key secret`
    )

    
    removeDatabase(args);

    createDatabase(args);

    getDatabaseKey(args);

    return new Client({
        secret : TestClientSecret,
        domain : `localhost`,
        port : (args && args.port) || 8443
    })

}

export const removeAllFauna = ()=>{
    execSync("docker stop faunadb");
}