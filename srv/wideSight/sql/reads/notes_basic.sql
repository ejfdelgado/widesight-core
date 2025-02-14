SELECT *
FROM $ { schemaId }.note
where media_id='${mediaId}'
ORDER BY $ { orderColumn } $ { direction }
LIMIT ${limit} 
OFFSET ${offset};
