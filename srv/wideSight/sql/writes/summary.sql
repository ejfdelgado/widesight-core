-- Insert Object
INSERT INTO
    $ { schemaId }.summary(
        media_id,
        media_type,
        created_at,
        created_time,
        text,
        account_id,
        account_name,
        app_id,
        app_name
    )
SELECT
    '${mediaId|sanitizeText}',
    '${mediaType|sanitizeText}',
    to_timestamp($ { now | sanitizeNumber } / 1000),
    $ { now },
    '${object.output|sanitizeText}',
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