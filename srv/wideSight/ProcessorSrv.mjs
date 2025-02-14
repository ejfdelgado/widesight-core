import axios from "axios";
import { encode, decode } from "@msgpack/msgpack";
import { SocketIOCall } from "@ejfdelgado/ejflab-back/srv/SocketIOCall.mjs";
import { SimpleObj } from "@ejfdelgado/ejflab-common/src/SimpleObj.js";
import { General } from "@ejfdelgado/ejflab-back/srv/common/General.mjs";
import { UtilMultiPart } from "./UtilMultiPart.mjs";
import { uuidv7 } from "uuidv7";
import { ProxyService } from "./ProxyService.mjs";

export class ProcessorSrv {
    static async process(processor, command, processorMethod = "health") {
        const processorsModel = SocketIOCall.getRoomLiveTupleModel("processors");
        const path = `model.data.state.processors.${processor}.postUrl`;
        const postUrl = SimpleObj.getValue(processorsModel, path, null);
        const options = {
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            headers: { "Content-Type": "application/octet-stream" }
        };
        const decoded = {
            processorMethod,
            namedInputs: {
                command,
            },
            data: {},
            room: "processors",
            id: "NA"
        };
        const encoded = encode(decoded);
        const buffer = Buffer.from(encoded);
        const temp = await axios.post(`${postUrl}/syncprocess`, buffer, options);
        return temp.data;
    }
    static async nvidiaSMI(req, res, next) {
        const processor = req.params['processor'];
        const response = await ProcessorSrv.process(processor, "nvidia-smi");
        res.status(200).send(response);
    }

    static async nvcc(req, res, next) {
        const processor = req.params['processor'];
        const response = await ProcessorSrv.process(processor, "nvcc --version");
        res.status(200).send(response);
    }

    static async ldconfig(req, res, next) {
        const processor = req.params['processor'];
        const response = await ProcessorSrv.process(processor, "ldconfig -p | grep cuda");
        res.status(200).send(response);
    }

    static async command(req, res, next) {
        const processor = req.params['processor'];
        const cmd = General.readParam(req, "cmd", "ls");
        const response = await ProcessorSrv.process(processor, cmd);
        res.status(200).send(response);
    }

    static async python(req, res, next) {
        const processor = req.params['processor'];
        const code = General.readParam(req, "code", "");
        const processorMethod = "python";
        const response = await ProcessorSrv.process(processor, code, processorMethod);
        res.status(200).send(response);
    }

    static async upload(req, res, next) {
        const processor = req.params['processor'];
        let file = req.files["file"];
        if (!file || file.length == 0) {
            throw new ParametrosIncompletosException(
                "The multipart field file not received"
            );
        }
        file = file[0];
        const fileBytes = await UtilMultiPart.readStreamToBytes(file.stream);
        const response = {
            fileName: file.originalName,
            fileSize: fileBytes.length,
        };
        const decoded = {
            channel: "post",
            room: "processors",
            processorMethod: `upload_file`,
            namedInputs: {
                bytes: fileBytes,
                file_name: file.originalName,
            },
            id: uuidv7(),
            data: {

            },
        };
        const processorsModel = SocketIOCall.getRoomLiveTupleModel("processors");
        const path = `model.data.state.processors.${processor}.postUrl`;
        const postUrl = SimpleObj.getValue(processorsModel, path, null);
        const options = {
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            headers: { "Content-Type": "application/octet-stream" }
        };
        const encoded = encode(decoded);
        const buffer = Buffer.from(encoded);
        const processorResponse = await axios.post(`${postUrl}/syncprocess`, buffer, options);
        response.error = processorResponse?.data?.error;
        //console.log(processorResponse);
        res.status(200).send(response);
    }
}