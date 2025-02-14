import { MalaPeticionException } from "@ejfdelgado/ejflab-back/srv/MyError.mjs";
import { General } from "@ejfdelgado/ejflab-back/srv/common/General.mjs";

export class CommonService {
    static PAGE_SIZE_DEFAULT = "20";
    static PAGE_DIRECTION = "DESC";
    static DIRECTION_CHOICES = ["asc", "desc"];

    static getPaginationArguments(req, orderColumnDef = null) {
        const limit = parseInt(General.readParam(req, "limit", CommonService.PAGE_SIZE_DEFAULT));
        const orderColumn = General.readParam(req, "orderColumn", orderColumnDef);
        const direction = General.readParam(req, "direction", CommonService.PAGE_DIRECTION).toLowerCase();
        const page = parseInt(General.readParam(req, "page", "0"));
        if (!(typeof limit == "number")) {
            throw new MalaPeticionException("limit is expected to be a number");
        }
        if (!(typeof page == "number")) {
            throw new MalaPeticionException("page is expected to be a number");
        }
        if (CommonService.DIRECTION_CHOICES.indexOf(direction) < 0) {
            throw new MalaPeticionException(`direction is expected to be one of ${CommonService.DIRECTION_CHOICES.join(', ')}`);
        }
        return {
            limit,
            orderColumn,
            direction,
            page,
            offset: page * limit
        };
    }

    static getSchemaFromAccountId(accountId) {
        return `acc_${accountId.replace(/-/g, '_')}`;
    }

    static getRoomFromAccountIdAndMediaId(accountId, mediaId) {
        return `${accountId}__${mediaId}`.replace(/-/g, '_');
    }
}