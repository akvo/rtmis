-- used when we access the path directly
CREATE INDEX administrations_administration_path
ON administrations_administration
USING btree(path);

-- used when we get descendants or ancestors
CREATE INDEX administrations_administration_path_gist
ON administrations_administration
USING GIST(path);
