-- Get objects in the list
SELECT
    id,
    media_type as "mediaType",
    object_type_id as "objectTypeId",
    object_type_name as "objectTypeName",
    media_id as "mediaId",
    media_source_url as "mediaSourceUrl",
    media_start_time as "mediaStartTimestamp",
    media_end_time as "mediaEndTimestamp",
    created_time as "createdDate",
    thumbnail,
    source_url as "imageSourceUrl",
    frame_width as "frameWidth",
    frame_height as "frameHeight",
    image_bbox_x1 as "imageBboxX1",
    image_bbox_y1 as "imageBboxY1",
    image_bbox_x2 as "imageBboxX2",
    image_bbox_y2 as "imageBboxY2",
    image_bbox_score as "imageBboxScore",
    text,
    text_score as "textScore",
    app_id as "appId",
    app_name as "appName"
FROM
    $ { schemaId }.object object
WHERE
    object.id = '${objectId | sanitizeText}';