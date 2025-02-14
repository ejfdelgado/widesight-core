-- Media

CREATE TABLE IF NOT EXISTS ${schemaId}.media
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    type character varying(8) COLLATE pg_catalog."default" NOT NULL,
    name character varying(1024) COLLATE pg_catalog."default",
    source_url character varying(2048) COLLATE pg_catalog."default",
    thumbnail character varying(2048) COLLATE pg_catalog."default",
    description character varying(5120) COLLATE pg_catalog."default",
    state character varying(32) COLLATE pg_catalog."default",
    progress NUMERIC(3,0),
    file_size_bytes bigint,
    created_time bigint,
    created_at timestamp without time zone,
    done_time bigint,
    done_at timestamp without time zone,
    duration_ms bigint,
    start_at timestamp without time zone,
    start_time bigint,
    end_at timestamp without time zone,
    end_time bigint,
    frame_width bigint,
    frame_height bigint,
    mime_type character varying(32) COLLATE pg_catalog."default",
    extension character varying(8) COLLATE pg_catalog."default",
    original_file_name character varying(1024) COLLATE pg_catalog."default",
    CONSTRAINT media_pkey PRIMARY KEY (id, type)
) PARTITION BY LIST (type);

ALTER TABLE IF EXISTS ${schemaId}.media
    OWNER to "${authorization_user}";

CREATE TABLE ${schemaId}.video PARTITION OF ${schemaId}.media 
     FOR VALUES IN ('VIDEO', 'video');

CREATE TABLE ${schemaId}.audio PARTITION OF ${schemaId}.media 
     FOR VALUES IN ('AUDIO', 'audio');

CREATE TABLE ${schemaId}.image PARTITION OF ${schemaId}.media 
     FOR VALUES IN ('IMAGE', 'image');