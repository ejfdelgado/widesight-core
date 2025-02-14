-- Insert Object
INSERT INTO
    $ { schemaId }.object(
        media_id,
        media_type,
        object_type_id,
        object_type_name,
        media_source_url,
        media_start_at,
        media_start_time,
        media_end_at,
        media_end_time,
        created_at,
        created_time,
        thumbnail,
        source_url,
        frame_width,
        frame_height,
        image_bbox_x1,
        image_bbox_y1,
        image_bbox_x2,
        image_bbox_y2,
        image_bbox_score,
        text,
        text_score,
        account_id,
        account_name,
        app_id,
        app_name
    )
SELECT
    '${object.mediaId|sanitizeText}',
    '${object.mediaType|sanitizeText}',
    '${object.objectTypeId|sanitizeText}',
    object_type.name,
    '${object.mediaSourceUrl|sanitizeText}',
    to_timestamp(
        $ { object.mediaStartTime | sanitizeNumber } / 1000
    ),
    $ { object.mediaStartTime | sanitizeNumber },
    to_timestamp(
        $ { object.mediaEndTime | sanitizeNumber } / 1000
    ),
    $ { object.mediaEndTime | sanitizeNumber },
    to_timestamp($ { now | sanitizeNumber } / 1000),
    $ { now },
    '${object.thumbnail|sanitizeText}',
    '${object.imageSourceUrl|sanitizeText}',
    $ { object.frameWidth | sanitizeNumber },
    $ { object.frameHeight | sanitizeNumber },
    $ { object.imageBboxX1 | sanitizeNumber },
    $ { object.imageBboxY1 | sanitizeNumber },
    $ { object.imageBboxX2 | sanitizeNumber },
    $ { object.imageBboxY2 | sanitizeNumber },
    $ { object.imageBboxScore | sanitizeNumber },
    '${object.text|sanitizeText}',
    $ { object.textScore | sanitizeNumber },
    '${accountId|sanitizeText}',
    account.name,
    '${appId|sanitizeText}',
    app.name
FROM
    general.object_type object_type,
    general.account account,
    $ { schemaId }.app app
WHERE
    object_type.id = '${object.objectTypeId|sanitizeText}'
    AND account.id = '${accountId|sanitizeText}'
    AND app.id = '${appId|sanitizeText}'
RETURNING id;