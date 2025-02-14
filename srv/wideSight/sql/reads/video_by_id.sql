-- Get single video given account, app id and media id
SELECT
    media.id as "id",
    media.name as "name",
    media.source_url as "sourceUrl",
    media.thumbnail as "thumbnail",
    media.description as "description",
    media.file_size_bytes as "fileSize",
    media.duration_ms as duration,
    media.frame_width as "frameWidth",
    media.frame_height as "frameHeight",
    media.start_time as "startTime",
    media.end_time as "endTime",
    media.created_time as "createdTime",
    media.extension as "extension",
    media.state as "state",
    progress as "progress"
FROM
    $ { schemaId }.media media --INNER JOIN $ { schemaId }.app_media app_media ON app_media.media_id = media.id
WHERE
    media.type = 'VIDEO'
    AND --app_media.app_id = '${appId}' AND
    media.id = '${mediaId}'