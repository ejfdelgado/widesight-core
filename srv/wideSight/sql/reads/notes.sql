SELECT note.speaker || ': ' || note.text as txt FROM $ { schemaId }.note note
where note.media_id='${mediaId}'
ORDER BY note.media_start_time ASC 
LIMIT ${limit} 
OFFSET ${offset};
