-- Count all videos given account, app id
SELECT
    count(1)
FROM
    $ { schemaId }.media media
    INNER JOIN $ { schemaId }.app_media app_media ON app_media.media_id = media.id
WHERE
    app_media.app_id = '${appId}'
    AND media.type = 'VIDEO';