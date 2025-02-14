'use strict';
import { PostgresSrv } from "@ejfdelgado/ejflab-back/srv/PostgresSrv.mjs";
import { CommonService } from "./CommonService.mjs";

export class AppsService {
    static async listApps(req, res, next) {
        const accountId = req.params["accountId"];
        const schemaId = CommonService.getSchemaFromAccountId(accountId);
        const { orderColumn, direction, limit, offset } =
            CommonService.getPaginationArguments(req, "id");

        const model = {
            accountId,
            schemaId,
            orderColumn,
            direction,
            limit,
            offset,
        };
        const result = await PostgresSrv.executeFile("srv/wideSight/sql/reads/apps_given_account.sql", model);
        res.status(200).send(result.rows);
    }

    static async createApp(req, res, next) {
        const accountId = req.params["accountId"];
        const schemaId = CommonService.getSchemaFromAccountId(accountId);
        const model = req.body;
        model.accountId = accountId;
        model.schemaId = schemaId;
        const result = await PostgresSrv.executeFile("srv/wideSight/sql/create/app.sql", model);
        const response = {
            inserted: result.rowCount,
        };
        res.status(200).send(response);
    }

    static async deleteApp(req, res, next) {
        const accountId = req.params["accountId"];
        const schemaId = CommonService.getSchemaFromAccountId(accountId);
        const appId = req.params["appId"];
        const model = {
            accountId,
            schemaId,
            appId,
        };
        const result = await PostgresSrv.executeFile("srv/wideSight/sql/destroy/app.sql", model);
        const response = {
            inserted: result.rowCount,
        };
        res.status(200).send(response);
    }

    static async getApp(req, res, next) {
        const accountId = req.params['accountId'];
        const schemaId = CommonService.getSchemaFromAccountId(accountId);
        const appId = req.params['appId'];
        const query = "SELECT id, name \
        FROM ${schemaId}.app \
        where id=${appId}";
        const model = {
            schemaId,
            accountId,
            appId,
        };
        const result = await PostgresSrv.executeText(query, model);
        AppsService.format(result.rows);
        if (result.rows.length > 0) {
            res.status(200).send(result.rows[0]);
        } else {
            res.status(204).send();
        }
    }
}