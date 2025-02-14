'use strict';

import { CommonService } from "./CommonService.mjs";

export class LiveService {
  static async searchStreamings(req, res, next) {
    const accountId = req.params['accountId'];
    const appId = req.params['appId'];
    const {
      limit,
      orderColumn,
      direction,
      page
    } = CommonService.getPaginationArguments(req);
    const response = await LiveServiceImplementation.searchStreamings(accountId, appId, limit, orderColumn, direction, page);
    res.status(200).send(response);
  }

  static async addStreaming(req, res, next) {
    const accountId = req.params['accountId'];
    const appId = req.params['appId'];
    const streaming = req.body.streaming ? req.body.streaming : req.body;
    const response = await LiveServiceImplementation.addStreaming(accountId, appId, streaming);
    res.status(200).send(response);
  }
}

export class LiveServiceImplementation {
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
   * returns SearchStreamingsResponse
   **/
  static async searchStreamings(accountId, appId, limit, orderColumn, direction, page) {
    return {
      "pagination": {
        "limit": limit,
        "page": page,
        "totalPages": 0,
        "orderColumn": orderColumn,
        "direction": direction,
        "count": 0
      },
      "results": [
        {
          "id": "string",
          "status": "string",
          "thumbnail": "string"
        }
      ]
    };
  }

  /**
  * Add streamig
  * Add streaming
  *
  * accountId String Account id
  * appId String App id
  * streaming AddStreamingRequest Streaming data (optional)
  * no response value expected for this operation
  **/
  static async addStreaming(accountId, appId, streaming) {
    return {
      "streaming": streaming
    };
  }
}

