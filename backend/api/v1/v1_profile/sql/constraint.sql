ALTER TABLE administrations_administration
ADD CONSTRAINT check_no_recursion
CHECK(index(path, code::text::ltree) = (nlevel(path) - 1));
