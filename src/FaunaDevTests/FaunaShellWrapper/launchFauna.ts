import {execSync} from "child_process";
import {Writable} from "stream";
import Docker, { Container } from "dockerode";
import { PageantAgent } from "ssh2";
import { generate } from "shortid";

export const FaunaDocker = "fauna/faunadb";
export const FaunaName = "faunadb";
export const ReadyMessage = "FaunaDB is ready.";
export const DefaultPort = 8443;

export const MainStream = new Writable();
MainStream.on("error", (error)=>{

    throw new Error("Output from a FaunaDB Docker container indicates an error has occurred.")

})
MainStream._write = (chunk, encoding, done)=>{

    done();

}

export const isReady = (out : string) : boolean=>{

    return (out.match(ReadyMessage)?.length || 0) > 0

}

export const faunaExists = async (docker : Docker) : Promise<boolean>=>{

    const images = await docker.listImages();;
    const matches = images.filter((image)=>{
        return image.RepoTags.includes(FaunaDocker);
    });
    return matches.length > 0;

}

export interface FaunaStreamWritePackageI {
    mainStream : Writable,
    resolve : (value : any)=>void,
    reject : (value : any)=>void
}


export interface FaunaLaunchI {
    docker : Docker,
    container : Container,
    image : string,
    name : string,
    stream : NodeJS.ReadWriteStream
}

export const FaunaContainer = async (
    options? : Docker.ContainerCreateOptions
) : Promise<FaunaLaunchI>=>{

    const docker = new Docker();

    if(!await faunaExists(docker)){
        await docker.pull(FaunaDocker);
    }

    const name = `${FaunaName}-${generate()}`;
    const container = await docker.createContainer({
        Image : FaunaDocker,
        name : name,
        ...options
    });

    const stream = await container.attach({
        hijack : true,
        stderr : true,
        sdtin : true,
        stdout : true,
        stream : true
    });
    stream.pipe(MainStream);

    const out = new Promise<FaunaLaunchI>((resolve, reject)=>{

        stream.on('data', (data)=>{

            const response = data && data.toString();

            if(isReady(response)){
                resolve({
                    docker : docker,
                    container : container,
                    image : FaunaDocker,
                    name : name,
                    stream : stream
                })
            }

        })

        stream.on('error', ()=>{

            reject();

        })

        stream.on('close', ()=>{

            reject();

        })

    })


    await container.start();

    return out;


}