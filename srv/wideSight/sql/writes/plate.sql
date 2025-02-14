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
    '${mediaId|sanitizeText}',
    '${mediaType|sanitizeText}',
    'LICENCE_PLATE',
    object_type.name,
    --'${object.mediaSourceUrl|sanitizeText}',
    '',
    to_timestamp(
        $ { object.millis | sanitizeNumber } / 1000
    ),
    $ { object.millis | sanitizeNumber },
    to_timestamp(
        $ { object.millis | sanitizeNumber } / 1000
    ),
    $ { object.millis | sanitizeNumber },
    to_timestamp($ { now | sanitizeNumber } / 1000),
    $ { now },
    '${object.license_plate.thumbnail|sanitizeText}',
    '${object.license_plate_path|sanitizeText}',
    $ { object.image_width | sanitizeNumber },
    $ { object.image_height | sanitizeNumber },
    $ { object.license_plate.bbox.x1 | sanitizeNumber },
    $ { object.license_plate.bbox.y1 | sanitizeNumber },
    $ { object.license_plate.bbox.x2 | sanitizeNumber },
    $ { object.license_plate.bbox.y2 | sanitizeNumber },
    $ { object.license_plate.bbox_score | sanitizeNumber },
    '${object.license_plate_text|sanitizeText}',
    $ { object.license_plate.text_score | sanitizeNumber },
    '${accountId|sanitizeText}',
    account.name,
    '${appId|sanitizeText}',
    app.name
FROM
    general.object_type object_type,
    general.account account,
    $ { schemaId }.app app
WHERE
    object_type.id = 'LICENCE_PLATE'
    AND account.id = '${accountId|sanitizeText}'
    AND app.id = '${appId|sanitizeText}'
RETURNING id;