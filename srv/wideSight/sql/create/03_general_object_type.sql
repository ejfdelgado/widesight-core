-- Object Type

CREATE TABLE IF NOT EXISTS general.object_type
(
    id character varying(128) COLLATE pg_catalog."default" NOT NULL,
    name character varying(256) COLLATE pg_catalog."default",
    CONSTRAINT object_type_pkey PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS general.object_type
    OWNER to "${authorization_user}";

INSERT INTO general.object_type(id, name) VALUES ('FACE', 'Face');
INSERT INTO general.object_type(id, name) VALUES ('VEHICLE', 'Vehicle');
INSERT INTO general.object_type(id, name) VALUES ('LICENCE_PLATE', 'Licence Plate');
INSERT INTO general.object_type(id, name) VALUES ('BODY', 'Body');
INSERT INTO general.object_type(id, name) VALUES ('WEAPON', 'Weapon');
INSERT INTO general.object_type(id, name) VALUES ('INTENT', 'Intent');