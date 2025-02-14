INSERT INTO
    $ { schemaId }.media(
        id,
        type,
        name,
        description,
        created_time,
        created_at,
        start_time,
        start_at,
        state
    )
VALUES
    (
        '${media.id}',
        '${media.media_type}',
        '${media.name|sanitizeText}',
        '${media.description|sanitizeText}',
        $ { media.created_time },
        to_timestamp($ { media.created_time } / 1000),
        $ { media.start_time | sanitizeNumber :0 },
        to_timestamp($ { media.start_time | sanitizeNumber :0 } / 1000),
        'CREATED'
    );

-- Assosiate it with the app
INSERT INTO
    $ { schemaId }.app_media(app_id, media_id, media_type)
VALUES
    ('${appId}', '${media.id}', '${media.media_type}');