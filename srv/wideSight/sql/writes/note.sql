-- Insert Object
INSERT INTO
    $ { schemaId }.note(
        media_id,
        media_type,
        media_source_url,
        media_start_at,
        media_start_time,
        media_end_at,
        media_end_time,
        created_at,
        created_time,
        speaker,
        title,
        text,
        account_id,
        account_name,
        app_id,
        app_name
    )
SELECT
    '${object.mediaId|sanitizeText}',
    '${object.mediaType|sanitizeText}',
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
    '${object.speaker|sanitizeText}',
    '',
    '${object.text|sanitizeText}',
    '${accountId|sanitizeText}',
    account.name,
    '${appId|sanitizeText}',
    app.name
FROM
    general.account account,
    $ { schemaId }.app app
WHERE
    account.id = '${accountId|sanitizeText}'
    AND app.id = '${appId|sanitizeText}'
RETURNING id;