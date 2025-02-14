
-- Update metadata from meta video file
UPDATE
    $ { schemaId }.media
SET
    duration_ms = $ { object.seconds }*1000,
    start_time = ${object.date_created},
    start_at = to_timestamp(${object.date_created} / 1000),
    end_time = $ { object.seconds }*1000 + ${object.date_created},
    end_at = to_timestamp(($ { object.seconds }*1000 + ${object.date_created}) / 1000),
    frame_width = $ { object.image.width },
    frame_height = $ { object.image.height },
    -- Same pattern must match flowcharts/audio/flow01_config_meta.drawio
    thumbnail = 'thumbnails/${accountId}/${mediaId}.png',
    state = 'PROCESSING'
WHERE
    type = 'VIDEO'
    and id = '${mediaId}';