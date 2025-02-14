import {
  commonHeaders,
  handleErrorsDecorator,
} from "@ejfdelgado/ejflab-back/srv/Network.mjs";
import { VideoService } from "./VideosService.mjs";
import express from "express";
import * as multer from "multer";
import { LiveService } from "./LiveService.mjs";
import { ObjectsService } from "./ObjectsService.mjs";
import { UsersService } from "./UsersService.mjs";
import { AccountService } from "./AccountService.mjs";
import { DataBaseService } from "./DataBaseService.mjs";
import { AppsService } from "./AppsService.mjs";
import { ProcessorSrv } from "./ProcessorSrv.mjs";
import { NotesService } from "./NotesService.mjs";

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;
const upload = multer.default({
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    fieldSize: MAX_FILE_SIZE_BYTES,
  },
});

/*
 * Swagger from:
 * https://app.swaggerhub.com/apis/apps-c21/WideSight/1.0.0#/objects/searchObjects
 */
export class WideSightSrv {
  static configure(app) {
    // VideoService
    app.get("/srv/widesight/accounts/:accountId/apps/:appId/videos", [commonHeaders, handleErrorsDecorator(VideoService.searchVideos),]);
    app.post("/srv/widesight/accounts/:accountId/apps/:appId/videos", [commonHeaders, express.json(), handleErrorsDecorator(VideoService.addVideo),]);
    app.post("/srv/widesight/accounts/:accountId/apps/:appId/db/videos", [commonHeaders, express.json(), handleErrorsDecorator(VideoService.addVideoDB),]);
    const uploadVideoMultiPart = upload.fields([
      { name: "video", maxCount: 1 },
    ]);
    app.put("/srv/widesight/accounts/:accountId/apps/:appId/videos/:id/upload", [commonHeaders, uploadVideoMultiPart, handleErrorsDecorator(VideoService.uploadVideo),]);
    app.post("/srv/widesight/accounts/:accountId/apps/:appId/videos/:videoId/process", [commonHeaders, express.json(), handleErrorsDecorator(VideoService.processVideo),]);
    app.get("/srv/widesight/accounts/:accountId/apps/:appId/videos/:videoId", [commonHeaders, handleErrorsDecorator(VideoService.getVideoById),]);
    app.put("/srv/widesight/accounts/:accountId/apps/:appId/videos/:videoId/state", [commonHeaders, express.json(), handleErrorsDecorator(VideoService.updateVideoById),]);

    // LiveService
    app.get("/srv/widesight/accounts/:accountId/apps/:appId/streamings", [commonHeaders, handleErrorsDecorator(LiveService.searchStreamings),]);
    app.post("/srv/widesight/accounts/:accountId/apps/:appId/streamings", [commonHeaders, express.json(), handleErrorsDecorator(LiveService.addStreaming),]);

    // ObjectsService
    const searchObjectsMultiPart = upload.fields([
      { name: "sourcePhoto", maxCount: 1 },
      { name: "searchBy", maxCount: 1 },
      { name: "minDistance", maxCount: 1 },
    ]);
    app.post("/srv/widesight/accounts/:accountId/apps/:appId/objects", [commonHeaders, searchObjectsMultiPart, handleErrorsDecorator(ObjectsService.searchObjects),]);
    app.post("/srv/widesight/accounts/:accountId/apps/:appId/objects/add", [commonHeaders, express.json(), handleErrorsDecorator(ObjectsService.addObjects),]);
    app.get("/srv/widesight/accounts/:accountId/apps/:appId/objects", [commonHeaders, handleErrorsDecorator(ObjectsService.paginateObjects),]);
    app.get("/srv/widesight/accounts/:accountId/objects/:objectId", [commonHeaders, handleErrorsDecorator(ObjectsService.getObjectById),]);
    app.get("/srv/widesight/accounts/:accountId/objects", [commonHeaders, handleErrorsDecorator(ObjectsService.paginateObjectsFilter),]);

    app.get("/srv/widesight/accounts/:accountId/notes/:mediaId", [commonHeaders, handleErrorsDecorator(NotesService.page),]);
    app.get("/srv/widesight/accounts/:accountId/summary/:mediaId", [commonHeaders, handleErrorsDecorator(NotesService.summary),]);



    // UsersService
    app.get("/srv/widesight/users/:email", [commonHeaders, handleErrorsDecorator(UsersService.getUser),]);

    // AccountService
    app.post("/srv/widesight/accounts", [commonHeaders, express.json(), handleErrorsDecorator(AccountService.create),]);
    app.get("/srv/widesight/accounts/:email", [commonHeaders, handleErrorsDecorator(AccountService.list),]);
    app.put("/srv/widesight/accounts/:accountId", [commonHeaders, express.json(), handleErrorsDecorator(AccountService.update),]);
    app.delete("/srv/widesight/accounts/:accountId", [commonHeaders, express.json(), handleErrorsDecorator(AccountService.destroy),]);

    // AppsService
    app.get("/srv/widesight/accounts/:accountId/apps", [commonHeaders, handleErrorsDecorator(AppsService.listApps),]);
    app.post("/srv/widesight/accounts/:accountId/apps", [commonHeaders, express.json(), handleErrorsDecorator(AppsService.createApp),]);
    app.delete("/srv/widesight/accounts/:accountId/apps/:appId", [commonHeaders, handleErrorsDecorator(AppsService.deleteApp),]);
    app.get("/srv/widesight/accounts/:accountId/apps/:appId", [commonHeaders, handleErrorsDecorator(AppsService.getApp),]);

    //app.post('/srv/widesight/accounts/:accountId/apps', [commonHeaders, express.json(), handleErrorsDecorator(AccountService.createApp)]);
    app.get("/srv/widesight/accounts/:accountId/apps", [commonHeaders, handleErrorsDecorator(AccountService.listApps),]);

    // Database setup
    app.post("/srv/widesight/db/general/create", [commonHeaders, handleErrorsDecorator(DataBaseService.generalCreate),]);
    app.post("/srv/widesight/db/general/destroy", [commonHeaders, handleErrorsDecorator(DataBaseService.generalDestroy),]);
    app.post("/srv/widesight/db/account/create", [commonHeaders, express.json(), handleErrorsDecorator(DataBaseService.accountCreate),]);
    app.post("/srv/widesight/db/account/destroy", [commonHeaders, express.json(), handleErrorsDecorator(DataBaseService.accountDestroy),]);

    // Helath Check processors
    app.get("/srv/widesight/processor/:processor/nvidia-smi", [commonHeaders, handleErrorsDecorator(ProcessorSrv.nvidiaSMI),]);
    app.get("/srv/widesight/processor/:processor/nvcc", [commonHeaders, handleErrorsDecorator(ProcessorSrv.nvcc),]);
    app.get("/srv/widesight/processor/:processor/ldconfig", [commonHeaders, handleErrorsDecorator(ProcessorSrv.ldconfig),]);
    app.get("/srv/widesight/processor/:processor/command", [commonHeaders, handleErrorsDecorator(ProcessorSrv.command),]);
    app.post("/srv/widesight/processor/:processor/python", [commonHeaders, express.json(), handleErrorsDecorator(ProcessorSrv.python),]);
    const uploadFileMultiPart = upload.fields([
      { name: "file", maxCount: 1 },
    ]);
    app.put("/srv/widesight/processor/:processor/upload", [commonHeaders, uploadFileMultiPart, handleErrorsDecorator(ProcessorSrv.upload),]);
  }
}
