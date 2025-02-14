"use strict";

import { Buffer } from "buffer";
import { PostgresSrv } from "@ejfdelgado/ejflab-back/srv/PostgresSrv.mjs";
import { uuidv7 } from "uuidv7";
import {
  InesperadoException,
  MalaPeticionException,
  ParametrosIncompletosException,
} from "@ejfdelgado/ejflab-back/srv/MyError.mjs";
import { CommonService } from "./CommonService.mjs";
import { ProxyService } from "./ProxyService.mjs";
import { encode } from "@msgpack/msgpack";
import { UtilMultiPart } from "./UtilMultiPart.mjs";
import { MinioSrv } from "@ejfdelgado/ejflab-back/srv/MinioSrv.mjs";
import { General } from "@ejfdelgado/ejflab-back/srv/common/General.mjs";

export class VideoService {
  static async getVideoById(req, res, next) {
    const accountId = req.params["accountId"];
    const appId = req.params["appId"];
    const videoId = req.params["videoId"];

    const response = await VideoServiceImplementation.getVideoById(
      accountId,
      videoId
    );
    res.status(200).send(response);
  }
  static async updateVideoById(req, res, next) {
    const accountId = req.params["accountId"];
    const appId = req.params["appId"];
    const videoId = req.params["videoId"];
    const video = req.body.video ? req.body.video : req.body;
    const response = await VideoServiceImplementation.updateVideoState(
      accountId,
      videoId,
      video.state
    );
    res.status(200).send(response);
  }
  static async searchVideos(req, res, next) {
    const accountId = req.params["accountId"];
    const appId = req.params["appId"];
    const { limit, orderColumn, direction, offset } =
      CommonService.getPaginationArguments(req, "created_at");

    const response = await VideoServiceImplementation.searchVideos(
      accountId,
      appId,
      limit,
      orderColumn,
      direction,
      offset
    );
    res.status(200).send(response);
  }
  static async addVideo(req, res, next) {
    const accountId = req.params["accountId"];
    const appId = req.params["appId"];
    const video = req.body.video ? req.body.video : req.body;
    const payload = {
      video,
    };
    // Crete uuid
    video.id = uuidv7();
    await ProxyService.call(
      "post",
      `srv/widesight/accounts/${accountId}/apps/${appId}/db/videos`,
      payload
    );
    const response = {
      video: {
        id: video.id,
      },
    };
    res.status(200).send(response);
  }
  static async addVideoDB(req, res, next) {
    const accountId = req.params["accountId"];
    const appId = req.params["appId"];
    const video = req.body.video ? req.body.video : req.body;
    const response = await VideoServiceImplementation.addVideo(
      accountId,
      appId,
      video
    );
    res.status(200).send(response);
  }
  static async uploadVideo(req, res, next) {
    const accountId = req.params["accountId"];
    const appId = req.params["appId"];
    const id = req.params["id"];
    const bucket = General.readParam(req, "bucket", process.env.BUCKET_PUBLIC);
    let video = req.files["video"];
    if (!video || video.length == 0) {
      throw new ParametrosIncompletosException(
        "The multipart field video not received"
      );
    }
    video = video[0];
    const response = await VideoServiceImplementation.uploadVideo(
      accountId,
      appId,
      id,
      video,
      bucket
    );
    res.status(200).send(response);
  }
  static async processVideo(req, res, next) {
    const accountId = req.params["accountId"];
    const appId = req.params["appId"];
    const videoId = req.params["videoId"];
    const settings = req.body.settings ? req.body.settings : req.body;
    const response = await VideoServiceImplementation.processVideo(
      accountId,
      appId,
      videoId,
      settings
    );
    res.status(200).send(response);
  }
}

export class VideoServiceImplementation {
  static async getVideoById(accountId, mediaId) {
    const schemaId = CommonService.getSchemaFromAccountId(accountId);
    const model = {
      schemaId,
      mediaId
    };
    const response = await PostgresSrv.executeFile(
      "srv/wideSight/sql/reads/video_by_id.sql",
      model
    );
    if (response.rows.length == 0) {
      return null;
    } else {
      const video = response.rows[0];
      return video;
    }
  }

  static async updateVideoState(accountId, mediaId, state) {
    const schemaId = CommonService.getSchemaFromAccountId(accountId);
    const model = {
      schemaId,
      media: {
        id: mediaId,
        state
      }
    };
    const result = await PostgresSrv.executeFile(
      "srv/wideSight/sql/updates/video_state.sql",
      model
    );
    return {
      updated: result.rowCount,
    };
  }
  /**
   * List videos
   * To list video archives
   *
   * accountId String Account id
   * appId String App id
   * limit Integer maximum number of records to return (optional)
   * orderColumn String name column to sort (optional)
   * direction String Direction  * `ASC` * `DESC`  (optional)
   * page Integer page (optional)
   * returns SearchVideosResponse
   **/
  static async searchVideos(
    accountId,
    appId,
    limit,
    orderColumn,
    direction,
    offset
  ) {
    const schemaId = CommonService.getSchemaFromAccountId(accountId);
    const model = {
      appId,
      schemaId,
      orderColumn,
      direction,
      limit,
      offset,
    };
    const promise1 = PostgresSrv.executeFile(
      "srv/wideSight/sql/reads/videos.sql",
      model
    );
    const promise2 = PostgresSrv.executeFile(
      "srv/wideSight/sql/reads/video_count.sql",
      model
    );
    const promesas = await Promise.all([promise1, promise2]);
    return {
      pagination: {
        limit: limit,
        page: Math.floor(offset / limit),
        totalPages: Math.ceil(parseInt(promesas[1].rows[0].count) / limit),
        orderColumn: orderColumn,
        direction: direction,
        count: promesas[0].rows.length,
      },
      results: promesas[0].rows,
    };
  }

  /**
   * Add new video
   * Add video to archive
   *
   * accountId String Account id
   * appId String App id
   * video AddVideoRequest Video item to add (optional)
   * returns AddVideoResponse
   **/
  static async addVideo(accountId, appId, video) {
    // Get video fields
    const { id, name, description, startTime } = video;
    const schemaId = CommonService.getSchemaFromAccountId(accountId);
    const model = {
      media: {
        id,
        name,
        description,
        start_time: startTime,
        created_time: new Date().getTime(),
        media_type: "VIDEO",
      },
      schemaId,
      accountId,
      appId,
    };
    const result = await PostgresSrv.executeFileInTransaction(
      "srv/wideSight/sql/writes/video.sql",
      model
    );
    return {
      inserted: result.rowCount,
    };
  }

  /**
   * Upload video
   * Upload binary of video
   *
   * accountId String Account id
   * appId String App id
   * id String Video id
   * video File
   * no response value expected for this operation
   **/
  static async uploadVideo(accountId, appId, id, video, bucket) {
    const detail = {
      name: video.originalName,
      mimeType: video.clientReportedMimeType,
      bytesSize: video.size,
    };
    console.log(`Upload video ${video.originalName}`);
    const fileBytes = await UtilMultiPart.readStreamToBytes(video.stream);
    const parts = /^(.*)\.([^\.]+)/.exec(video.originalName);
    const extension = parts[2].toLocaleLowerCase();
    const schemaId = CommonService.getSchemaFromAccountId(accountId);
    const globalUUID = CommonService.getRoomFromAccountIdAndMediaId(
      accountId,
      id
    );
    console.log(`Upload received bytes ${fileBytes.length}`);
    // Update detail
    const model = {
      schemaId,
      accountId,
      appId,
      media: {
        id,
        file_size_bytes: detail.bytesSize,
        extension,
        original_file_name: detail.name,
        mime_type: detail.mimeType,
      },
    };
    const parallelPromises = [];
    const resultPromise = PostgresSrv.executeFile(
      "srv/wideSight/sql/updates/video_upload.sql",
      model
    );
    resultPromise.then(() => {
      console.log("resultPromise Ok!");
    }).catch((err) => {
      console.log(err);
    });
    parallelPromises.push(resultPromise);
    // ---------------------------------------------------------
    const payload = {
      channel: "post",
      room: globalUUID,
      processorMethod: "localFiles.write",
      namedInputs: {
        bytes: fileBytes,
      },
      id: globalUUID,
      data: {
        extension: extension,
      },
    };
    // Call the processors localfile write
    const encoded = encode(payload);
    const buffer = Buffer.from(encoded);
    const binaryData = new Blob([buffer]);
    const processorWritePromise = ProxyService.call(
      "post",
      `srv/flowchart/processor_process`,
      binaryData
    );
    processorWritePromise.then(() => {
      console.log("processorWritePromise Ok!");
    }).catch((err) => {
      console.log(err);
    });
    parallelPromises.push(processorWritePromise);
    console.log("Send processor upload!");
    // ---------------------------------------------------------
    // Put the video on minio
    if (bucket) {
      const payloadMinio = {
        objectPath: `videos/${accountId}/${id}.${extension}`,
        bytes: fileBytes,
        metadata: {
          "Content-Type": detail.mimeType
        }
      };
      console.log(payloadMinio.objectPath);
      const minioPromise = MinioSrv.writeFileLocal(bucket, payloadMinio);
      minioPromise.then(() => {
        console.log("minioPromise Ok!");
      }).catch((err) => {
        console.log(err);
      });
      parallelPromises.push(minioPromise);
      console.log("Send upload to minio!");
    } else {
      console.log("No upload to minio");
    }

    const result = await resultPromise;
    if (result.rowCount == 0) {
      throw new InesperadoException(`Can't update video ${id}`);
    }
    // Wait for all promises
    console.log("Waiting all upload promises...")
    await Promise.all(parallelPromises);

    return { detail };
  }

  /**
   * Process video
   * Start procesing video
   *
   * accountId String Account id
   * appId String App id
   * videoId String Video id
   * settings ProcessVideoRequest Process settings (optional)
   * no response value expected for this operation
   **/
  static async processVideo(accountId, appId, videoId, settings) {
    // Reads the video
    const schemaId = CommonService.getSchemaFromAccountId(accountId);
    const room = CommonService.getRoomFromAccountIdAndMediaId(
      accountId,
      videoId
    );
    const model = {
      schemaId,
      accountId,
      appId,
      mediaId: videoId,
    };
    const result = await PostgresSrv.executeFile(
      "srv/wideSight/sql/reads/video_by_id.sql",
      model
    );
    if (result.rows.length == 0) {
      throw new MalaPeticionException(
        `The video ${videoId} does not exists in app ${appId}`
      );
    }
    const videoItem = result.rows[0];
    const fileName = `${room}.${videoItem.extension}`;

    let {
      useFace,
      usePlate,
      useSpeech,
      preserveTempFiles,
      sleep,
    } = settings;

    useFace = !!useFace;
    usePlate = !!usePlate;
    useSpeech = !!useSpeech;
    preserveTempFiles = !!preserveTempFiles;

    if (typeof sleep != 'number') {
      sleep = 333;
    }

    const payload = {
      room,
      names: {
        Meta: "${WORKSPACE}/flowcharts/audio/flow01_config_meta.drawio",
        Milvus: "${WORKSPACE}/flowcharts/audio/flow01_config_milvus.drawio",
        Mongo: "${WORKSPACE}/flowcharts/audio/flow01_config_mongo.drawio",
        Postgres: "${WORKSPACE}/flowcharts/audio/flow01_config_postgres.drawio",
        Face: "${WORKSPACE}/flowcharts/audio/flow01_face.drawio",
        Plate: "${WORKSPACE}/flowcharts/audio/flow01_plate.drawio",
        Speech: "${WORKSPACE}/flowcharts/audio/flow01_speech.drawio",
        End: "${WORKSPACE}/flowcharts/audio/flow01_end.drawio",
        Conn1: "${WORKSPACE}/flowcharts/audio/flow01flux_meta.drawio",
        Conn2: "${WORKSPACE}/flowcharts/audio/flow01flux_face.drawio",
        Conn3: "${WORKSPACE}/flowcharts/audio/flow01flux_plate.drawio",
        Conn4: "${WORKSPACE}/flowcharts/audio/flow01flux_speech.drawio",
      },
      dataPath: {
        "state.sources": "${WORKSPACE}/flowcharts/audio/flow01src.json",
        "state.processors":
          "${WORKSPACE}/flowcharts/audio/flow01processors.json",
        "state.temporal": "${WORKSPACE}/flowcharts/audio/temporal.json",
        milvus: "${WORKSPACE}/flowcharts/audio/flow01milvus.json",
        mongo: "${WORKSPACE}/flowcharts/audio/flow01mongo.json",
        minio: "${WORKSPACE}/flowcharts/audio/flow01minio.json",
      },
      dataVal: {
        "state.sources.localFiles.audio.src": `/tmp/imageia/processor-pyclient/temp/${room}/localFiles/${fileName}`,
        "state.sources.localFiles.image.src": `/tmp/imageia/processor-pyclient/temp/${room}/localFiles/${fileName}`,
        "args.step.timelineSpeech": (typeof settings?.timelineSpeech == "number" ? settings.timelineSpeech : 5),
        "args.step.timelineNSpeech": (typeof settings?.timelineNSpeech == "number" ? settings.timelineNSpeech : 1),
        "args.step.timelineFace": (typeof settings?.timelineFace == "number" ? settings.timelineFace : 1),
        "args.step.timelineNFace": (typeof settings?.timelineNFace == "number" ? settings.timelineNFace : 1),
        "args.step.timelinePlate": (typeof settings?.timelinePlate == "number" ? settings.timelinePlate : 1),
        "args.step.timelineNPlate": (typeof settings?.timelineNPlate == "number" ? settings.timelineNPlate : 1),
        "args.reset": true,
        "args.milvus.clean_temp": true,
        "args.db.schemaId": schemaId,
        "args.db.accountId": accountId,
        "args.db.appId": appId,
        "args.db.mediaId": videoId,
        "args.db.mediaType": "VIDEO",
        "args.use_face": useFace,
        "args.use_plate": usePlate,
        "args.use_speech": useSpeech,
        "args.general.preserve_temp_files": preserveTempFiles,
        "performance": { track: true, n: 10 },
      },
      multiples: {
        minio_face: '${WORKSPACE}/flowcharts/audio/minio_face.drawio',
        minio_car: '${WORKSPACE}/flowcharts/audio/minio_car.drawio',
        minio_plate: '${WORKSPACE}/flowcharts/audio/minio_plate.drawio',
        flow01_face_loop: '${WORKSPACE}/flowcharts/audio/flow01_face_loop.drawio',
      },
      conf: {
        sleep: sleep,
        debug: false,
      },
      autoStart: true,
    };
    // Call the flowchart
    const response = await ProxyService.call(
      "post",
      `srv/flowchart/load`,
      payload
    );
    return response.data;
  }
}
