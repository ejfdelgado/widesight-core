"use strict";

import { ParametrosIncompletosException } from "@ejfdelgado/ejflab-back/srv/MyError.mjs";
import { CommonService } from "./CommonService.mjs";
import { ProxyService } from "./ProxyService.mjs";
import { PostgresSrv } from "@ejfdelgado/ejflab-back/srv/PostgresSrv.mjs";
import { encode } from "@msgpack/msgpack";
import { UtilMultiPart } from "./UtilMultiPart.mjs";
import { SimpleObj } from "@ejfdelgado/ejflab-common/src/SimpleObj.js";
import { General } from "@ejfdelgado/ejflab-back/srv/common/General.mjs";

export class ObjectsService {
  static async addObjects(req, res, next) {
    console.log("addObjects...");
    const accountId = req.params["accountId"];
    const appId = req.params["appId"];
    // Read the object
    const object = req.body.object ? req.body.object : req.body;
    const schemaId = CommonService.getSchemaFromAccountId(accountId);
    const model = {
      schemaId,
      accountId,
      appId,
      object,
      now: new Date().getTime(),
    };
    let script = "srv/wideSight/sql/writes/object.sql";
    if (object.objectTypeId == "INTENT") {
      script = "srv/wideSight/sql/writes/note.sql";
    }
    const result = await PostgresSrv.executeFileInTransaction(
      script,
      model
    );
    const response = {
      inserted: result.rowCount,
      object: result.rowCount == 1 ? result.rows[0] : null
    };
    res.status(200).send(response);
  }
  static async searchObjects(req, res, next) {
    console.log("searchObjects...");
    const accountId = req.params["accountId"];
    const appId = req.params["appId"];
    const { limit, orderColumn, direction, page, offset } =
      CommonService.getPaginationArguments(req);
    let sourcePhoto = req.files["sourcePhoto"];
    if (!sourcePhoto || sourcePhoto.length == 0) {
      throw new ParametrosIncompletosException(
        "The multipart field sourcePhoto not received"
      );
    }
    sourcePhoto = sourcePhoto[0];
    const searchBy = req.body["searchBy"];
    let minDistance = parseFloat(req.body["minDistance"]);
    if (isNaN(minDistance)) {
      minDistance = null;
    }
    const response = await ObjectsServiceImplementation.searchObjects(
      accountId,
      appId,
      limit,
      orderColumn,
      direction,
      offset,
      page,
      sourcePhoto,
      searchBy,
      minDistance
    );
    res.status(200).send(response);
  }

  static translateOrderColumn(column) {
    column = column.toLowerCase();
    const MAP = {
      "mediatype": "media_type",
      "objecttypeid": "object_type_id",
      "objecttypename": "object_type_name",
      "mediaid": "media_id",
      "mediasourceurl": "media_source_url",
      "mediastarttimestamp": "media_start_time",
      "mediaendtimestamp": "media_end_time",
      "createddate": "created_time",
      "imagesourceurl": "source_url",
      "framewidth": "frame_width",
      "frameheight": "frame_height",
      "imagebboxx1": "image_bbox_x1",
      "imagebboxy1": "image_bbox_y1",
      "imagebboxx2": "image_bbox_x2",
      "imagebboxy2": "image_bbox_y2",
      "imagebboxscore": "image_bbox_score",
      "textscore": "text_score",
      "appid": "app_id",
      "appname": "app_name",
    };
    if (column in MAP) {
      return MAP[column];
    }
    return column;
  }

  static async paginateObjects(req, res, next) {
    const accountId = req.params["accountId"];
    const appId = req.params["appId"];
    const { limit, orderColumn, direction, page, offset } =
      CommonService.getPaginationArguments(req, "created_time");
    // Read the object
    const schemaId = CommonService.getSchemaFromAccountId(accountId);
    const model = {
      schemaId,
      appId,
      limit,
      orderColumn: ObjectsService.translateOrderColumn(orderColumn),
      direction,
      page,
      offset
    };
    const results = (await PostgresSrv.executeFile("srv/wideSight/sql/reads/object_paginate.sql", model)).rows;
    res.status(200).send({
      pagination: {
        limit: limit,
        page: page,
        orderColumn: orderColumn,
        direction: direction,
      },
      results
    });
  }

  static decodeListParam(param, column) {
    if (!(typeof param == "string")) {
      return null;
    }
    const result = param.split(/[,;]/)
      .filter((actual) => {
        return (actual.trim().length > 0);
      })
      .filter((value, index, array) => {
        return array.indexOf(value) === index;
      })
      .map((actual) => {
        return `'${actual}'`;
      }).join(',');

    if (result.length > 0) {
      return `${column} IN (${result})`;
    } else {
      return null;
    }
  }

  static async paginateObjectsFilter(req, res, next) {
    const accountId = req.params["accountId"];
    const { limit, orderColumn, direction, page, offset } =
      CommonService.getPaginationArguments(req, "created_time");
    // Read filters
    let listAppId = ObjectsService.decodeListParam(General.readParam(req, "listAppId", null), 'app_id');
    let listVideoId = ObjectsService.decodeListParam(General.readParam(req, "listVideoId", null), 'media_id');
    let listObjectTypeId = ObjectsService.decodeListParam(General.readParam(req, "listObjectTypeId", null), 'object_type_id');
    let initDate = parseInt(General.readParam(req, "initDate", ""));
    let endDate = parseInt(General.readParam(req, "endDate", ""));

    const inclusiveArray = [];
    if (listAppId != null) {
      inclusiveArray.push(listAppId);
    }
    if (listVideoId != null) {
      inclusiveArray.push(listVideoId);
    }
    if (listObjectTypeId != null) {
      inclusiveArray.push(listObjectTypeId);
    }
    if (!isNaN(initDate)) {
      inclusiveArray.push(`media_start_time >= ${initDate}`);
    }
    if (!isNaN(endDate)) {
      inclusiveArray.push(`media_start_time <= ${endDate}`);
    }

    // Read the object
    const schemaId = CommonService.getSchemaFromAccountId(accountId);
    let where = '';
    if (inclusiveArray.length > 0) {
      where = ` \nWHERE \n${inclusiveArray.join(" \nAND ")}`;
    }

    const model = {
      schemaId,
      limit,
      orderColumn: ObjectsService.translateOrderColumn(orderColumn),
      direction,
      page,
      offset,
      where
    };
    const results = (await PostgresSrv.executeFile("srv/wideSight/sql/reads/object_paginate_filter.sql", model)).rows;
    res.status(200).send({
      pagination: {
        limit: limit,
        page: page,
        orderColumn: orderColumn,
        direction: direction,
      },
      results
    });
  }

  static async getObjectById(req, res, next) {
    const accountId = req.params["accountId"];
    const objectId = req.params["objectId"];

    const schemaId = CommonService.getSchemaFromAccountId(accountId);
    const model = {
      schemaId,
      objectId
    };
    const results = (await PostgresSrv.executeFile("srv/wideSight/sql/reads/object_by_id.sql", model)).rows;
    if (results.length == 0) {
      res.status(204).send();
      return;
    }
    res.status(200).send({
      object: results[0],
    });
  }
}

export class ObjectsServiceImplementation {
  /**
   * List objects
   * To list objects detected
   *
   * limit Integer maximum number of records to return (optional)
   * orderColumn String name column to sort (optional)
   * direction String Direction  * `ASC` * `DESC`  (optional)
   * page Integer page (optional)
   * sourcePhoto File  (optional)
   * searchBy String  (optional)
   * minDistance Double  (optional)
   * returns SearchObjectsResponse
   **/
  static async searchObjects(
    accountId,
    appId,
    limit,
    orderColumn,
    direction,
    offset,
    page,
    sourcePhoto,
    searchBy,
    minDistance
  ) {
    //console.log(`limit=${limit} offset=${offset}`);
    const fileBytes = await UtilMultiPart.readStreamToBytes(sourcePhoto.stream);
    const extension = sourcePhoto.detectedFileExtension.replace(/^\./, '');
    //Call processor process
    const options = {
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      headers: { "Content-Type": "application/octet-stream" }
    };
    const payload = {
      channel: 'post',
      processorMethod: 'frameExtractor1.read',
      room: 'processors',
      namedInputs: {
        bytes: fileBytes,
        dbData: {
          accountId,
          appId,
        },
        paging: {
          limit: limit,
          offset: offset,
        },
        extra: {
          minDistance
        }
      },
      data: {
        extension: extension,
      },
    };
    const encoded = encode(payload);
    const buffer = Buffer.from(encoded);
    const binaryData = new Blob([buffer]);
    const response = await ProxyService.call("post", `srv/flowchart/processor_process`, binaryData);
    if (response.status != 200) {
      throw new Error(response.statusText);
    }
    //console.log(JSON.stringify(response.data, null, 4));
    const list = SimpleObj.getValue(response, "data.response.data.results", []);
    //console.log(JSON.stringify(list, null, 4));

    let results = [];
    if (list.length > 0) {
      const ids = list.map((element) => {
        return element.entity.ref_id;
      });

      // Ask sql with the ids

      const schemaId = CommonService.getSchemaFromAccountId(accountId);
      const model = {
        schemaId,
        appId,
        listText: ids.map((id) => { return `'${id}'`; }).join(",")
      };

      results = (await PostgresSrv.executeFile("srv/wideSight/sql/reads/object_in_list.sql", model)).rows;
    }

    return {
      pagination: {
        limit: limit,
        page: page,
        orderColumn: orderColumn,
        direction: direction,
      },
      results: results,
    };
  }
}
