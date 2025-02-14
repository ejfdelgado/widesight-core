-- Search all videos given, account, app id and page
SELECT
    id as "id",
    name as "name",
    source_url as "sourceUrl",
    thumbnail as "thumbnail",
    description as "description",
    file_size_bytes as "fileSize",
    duration_ms as duration,
    frame_width as "frameWidth",
    frame_height as "frameHeight",
    start_time as "startTime",
    end_time as "endTime",
    created_time as "createdTime",
    extension as "extension",
    state as "state",
    progress as "progress"
FROM
    $ { schemaId }.media media
    INNER JOIN $ { schemaId }.app_media app_media ON app_media.media_id = media.id
WHERE
    app_media.app_id = '${appId}'
    AND media.type = 'VIDEO'
ORDER BY
    $ { orderColumn } $ { direction }
LIMIT
    $ {
limit
    } OFFSET $ { offset }