import axios from "axios";
import https from "https";

export class ProxyService {
    instance = null;
    static getInstance() {
        if (ProxyService.instance == null) {
            ProxyService.instance = axios.create({
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            });
        }
        return ProxyService.instance;
    }
    static getEndPoint() {
        let proxi = process.env.PROXI_ENDPOINT;
        if (!proxi) {
            proxi = "http://localhost:8081";
        }
        return proxi;
    }
    static async call(method, path, body) {
        const options = {
            //maxBodyLength: Infinity,
            //maxContentLength: Infinity,
            //specifies the number of milliseconds before the request times out.
            //timeout: 1000*60*10,
        };
        const instance = ProxyService.getInstance();
        const url = `${ProxyService.getEndPoint()}/${path}`;
        let request = null;
        if (method == "post") {
            request = instance.post(url, body, options);
        } else if (method == "put") {
            request = instance.put(url, body, options);
        } else if (method == "get") {
            request = instance.get(url, options);
        } else if (method == "delete") {
            request = instance.delete(url, options);
        }

        return new Promise((resolve, reject) => {
            request.then(res => { resolve(res) })
                .catch(error => {
                    let myMessage = "";
                    if (error.response) {
                        const { status, message } = error.response.data;
                        myMessage = message;
                    } else if (error.message) {
                        myMessage = error.message;
                    } else {
                        myMessage = `${error}`;
                    }
                    console.log(myMessage);
                    reject(Error(myMessage));
                });
        });
    }
}