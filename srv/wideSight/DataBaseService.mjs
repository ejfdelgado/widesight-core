import { General } from "@ejfdelgado/ejflab-back/srv/common/General.mjs";
import { ParametrosIncompletosException } from "@ejfdelgado/ejflab-back/srv/MyError.mjs";
import { PostgresSrv } from "@ejfdelgado/ejflab-back/srv/PostgresSrv.mjs";
import { CommonService } from "./CommonService.mjs";

export class DataBaseService {
    static async generalCreate(req, res, next) {
        const model = {
            "authorization_user": process.env.POSTGRES_USER,
        };

        const pool = PostgresSrv.getPool();
        const client = await pool.connect();
        await client.query('BEGIN')
        try {
            await PostgresSrv.executeFile("srv/wideSight/sql/create/01_general_schema.sql", model, client);
            await PostgresSrv.executeFile("srv/wideSight/sql/create/02_general_account.sql", model, client);
            await PostgresSrv.executeFile("srv/wideSight/sql/create/08_general_user.sql", model, client);
            await PostgresSrv.executeFile("srv/wideSight/sql/create/08_general_user_account.sql", model, client);
            await PostgresSrv.executeFile("srv/wideSight/sql/create/03_general_object_type.sql", model, client);
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e
        } finally {
            client.release();
        }

        const result = {
            status: "ok"
        };
        res.status(200).send(result);
    }

    static async generalDestroy(req, res, next) {
        const model = {
            "authorization_user": process.env.POSTGRES_USER,
        };
        await PostgresSrv.executeFile("srv/wideSight/sql/destroy/general.sql", model);
        const result = {
            status: "ok"
        };
        res.status(200).send(result);
    }

    static async accountCreate(req, res, next) {
        const accountId = General.readParam(req, "id", null);
        let accountName = General.readParam(req, "name", null);
        const accountEmail = General.readParam(req, "email", null);
        if (!accountId) {
            throw new ParametrosIncompletosException(`account id is required`);
        };
        if (!accountEmail) {
            throw new ParametrosIncompletosException(`account email is required`);
        };
        if (!accountName) {
            accountName = accountId;
        };
        const schemaId = CommonService.getSchemaFromAccountId(accountId);
        const model = {
            "authorization_user": process.env.POSTGRES_USER,
            "account_id": accountId,
            "account_name": accountName,
            "account_email": accountEmail,
            "now": new Date().getTime(),
            schemaId,
        };

        const pool = PostgresSrv.getPool();
        const client = await pool.connect();
        await client.query('BEGIN')
        try {
            // Create schema and tables
            await PostgresSrv.executeFile("srv/wideSight/sql/create/01_account_schema.sql", model, client);
            await PostgresSrv.executeFile("srv/wideSight/sql/create/02_account_app.sql", model, client);
            await PostgresSrv.executeFile("srv/wideSight/sql/create/03_account_media.sql", model, client);
            await PostgresSrv.executeFile("srv/wideSight/sql/create/04_account_app_media.sql", model, client);
            await PostgresSrv.executeFile("srv/wideSight/sql/create/05_account_object.sql", model, client);
            await PostgresSrv.executeFile("srv/wideSight/sql/create/05_account_note.sql", model, client);
            await PostgresSrv.executeFile("srv/wideSight/sql/create/05_account_summary.sql", model, client);
            await PostgresSrv.executeFile("srv/wideSight/sql/create/06_account_media_tag.sql", model, client);
            // Insert row
            await PostgresSrv.executeFile("srv/wideSight/sql/create/07_account_insert.sql", model, client);
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e
        } finally {
            client.release();
        }

        const result = {
            status: "ok"
        };
        res.status(200).send(result);
    }

    static async accountDestroy(req, res, next) {
        const accountId = General.readParam(req, "id", null);
        if (!accountId) {
            throw new ParametrosIncompletosException(`account id is required`);
        };
        const schemaId = CommonService.getSchemaFromAccountId(accountId);
        const model = {
            "authorization_user": process.env.POSTGRES_USER,
            "account_id": accountId,
            schemaId,
        };
        await PostgresSrv.executeFile("srv/wideSight/sql/destroy/account.sql", model);
        const result = {
            status: "ok"
        };
        res.status(200).send(result);
    }
}