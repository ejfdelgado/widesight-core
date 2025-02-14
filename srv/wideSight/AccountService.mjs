"use strict";
import { General } from "@ejfdelgado/ejflab-back/srv/common/General.mjs";
import { ParametrosIncompletosException } from "@ejfdelgado/ejflab-back/srv/MyError.mjs";
import { uuidv7 } from "uuidv7";
import { ProxyService } from "./ProxyService.mjs";
import { PostgresSrv } from "@ejfdelgado/ejflab-back/srv/PostgresSrv.mjs";
import { CommonService } from "./CommonService.mjs";

export class AccountService {
  static async listApps(req, res, next) {
    const response = await AccountServiceImplementation.listApps();
    res.status(200).send(response);
  }

  static async create(req, res, next) {
    // account
    const account = req.body.account ? req.body.account : req.body;
    let accountName = account.name;
    const accountEmail = account.email;
    const accountId = uuidv7();
    if (!accountName) {
      accountName = accountId;
    }
    if (!accountEmail) {
      throw new ParametrosIncompletosException("Missed email");
    }

    // Call database endpoint
    const payload = {
      id: accountId,
      email: accountEmail,
      name: accountName,
    };
    await ProxyService.call("post", `srv/widesight/db/account/create`, payload);

    res.status(200).send(payload);
  }

  static async update(req, res, next) {
    let accountId = General.readParam(req, "accountId", null);
    // Call database endpoint
    const account = req.body.account ? req.body.account : req.body;
    const model = {
      id: accountId,
      body: account,
    };
    const query =
      "UPDATE general.account SET name='${body.name|sanitizeText}' WHERE id='${id}';";
    const result = await PostgresSrv.executeText(query, model);
    const { rowCount } = result;
    res.status(200).send({ rowCount });
  }

  static async destroy(req, res, next) {
    let accountId = General.readParam(req, "accountId", null);
    // Call database endpoint
    const payload = {
      id: accountId,
    };
    await ProxyService.call(
      "post",
      `srv/widesight/db/account/destroy`,
      payload
    );
    res.status(200).send(payload);
  }

  static async list(req, res, next) {
    let accountEmail = General.readParam(req, "email", null);
    const { orderColumn, direction, limit, offset } =
      CommonService.getPaginationArguments(req, "created_at");

    const model = {
      email: accountEmail,
      orderColumn,
      direction,
      limit,
      offset,
    };
    const result = await PostgresSrv.executeFile("srv/wideSight/sql/reads/account_given_user.sql", model);
    res.status(200).send(result.rows);
  }
}

export class AccountServiceImplementation {
  /**
   * List apps
   * List apps from account
   *
   * accountId String Account id
   * returns GetUserResponse
   **/
  static async listApps() {
    return {
      user: {
        email: "string",
        name: "string",
      },
      acounts: [
        {
          id: "string",
          name: "string",
          apps: [
            {
              id: "string",
              name: "string",
            },
          ],
        },
      ],
    };
  }
}
