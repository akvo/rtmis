-- function to calculate the path of any given administration
CREATE OR REPLACE FUNCTION _update_administration_path() RETURNS TRIGGER AS
$$
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.path = NEW.code::ltree;
    ELSE
        SELECT path || NEW.code
          FROM administrations_administration
         WHERE NEW.parent_id IS NULL or id = NEW.parent_id
          INTO NEW.path;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- function to update the path of the descendants of a administration
CREATE OR REPLACE FUNCTION _update_descendants_administration_path() RETURNS TRIGGER AS
$$
BEGIN
    UPDATE administrations_administration
       SET path = NEW.path || subpath(administrations_administration.path, nlevel(OLD.path))
     WHERE administrations_administration.path <@ OLD.path AND id != NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- calculate the path every time we insert a new administration
DROP TRIGGER IF EXISTS administration_path_insert_trg ON administrations_administration;
CREATE TRIGGER administration_path_insert_trg
               BEFORE INSERT ON administrations_administration
               FOR EACH ROW
               EXECUTE PROCEDURE _update_administration_path();


-- calculate the path when updating the parent or the code
DROP TRIGGER IF EXISTS administration_path_update_trg ON administrations_administration;
CREATE TRIGGER administration_path_update_trg
               BEFORE UPDATE ON administrations_administration
               FOR EACH ROW
               WHEN (OLD.parent_id IS DISTINCT FROM NEW.parent_id
                     OR OLD.code IS DISTINCT FROM NEW.code)
               EXECUTE PROCEDURE _update_administration_path();


-- if the path was updated, update the path of the descendants
DROP TRIGGER IF EXISTS administration_path_after_trg ON administrations_administration;
CREATE TRIGGER administration_path_after_trg
               AFTER UPDATE ON administrations_administration
               FOR EACH ROW
               WHEN (NEW.path IS DISTINCT FROM OLD.path)
               EXECUTE PROCEDURE _update_descendants_administration_path();
