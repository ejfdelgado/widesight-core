import { SimpleObj } from "@ejfdelgado/ejflab-common/src/SimpleObj.js";
import { General } from "@ejfdelgado/ejflab-back/srv/common/General.mjs";
import { PostgresSrv } from "@ejfdelgado/ejflab-back/srv/PostgresSrv.mjs";
import { CommonService } from "./CommonService.mjs";

export class NotesService {
    static async page(req, res, next) {
        const accountId = req.params["accountId"];
        const mediaId = req.params["mediaId"];
        const { limit, orderColumn, direction, page, offset } =
            CommonService.getPaginationArguments(req, "media_start_time");
        // Read the object
        const schemaId = CommonService.getSchemaFromAccountId(accountId);
        const model = {
            schemaId,
            mediaId,
            limit,
            orderColumn,
            direction,
            page,
            offset
        };
        const results = (await PostgresSrv.executeFile("srv/wideSight/sql/reads/notes_basic.sql", model)).rows;
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

    static async summary(req, res, next) {
        const accountId = req.params["accountId"];
        const mediaId = req.params["mediaId"];

        // Read the object
        const schemaId = CommonService.getSchemaFromAccountId(accountId);
        const model = {
            schemaId,
            mediaId
        };
        const results = (await PostgresSrv.executeFile("srv/wideSight/sql/reads/summary.sql", model)).rows;
        if (results.length > 0) {
            res.status(200).send({
                summary: results[0]
            });
        } else {
            res.status(204).send();
        }
    }
}