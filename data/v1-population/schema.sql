PRAGMA foreign_keys=ON;
CREATE TABLE cohort_manifest (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE template_snapshots (
 template_id TEXT PRIMARY KEY, version TEXT NOT NULL,
 provenance TEXT NOT NULL CHECK(provenance='newly-authored'), description TEXT NOT NULL
);
CREATE TABLE identities (
 identity_id TEXT PRIMARY KEY, world_id TEXT NOT NULL CHECK(world_id='V1'),
 name TEXT NOT NULL UNIQUE, age INTEGER NOT NULL CHECK(age BETWEEN 18 AND 84),
 birth_year INTEGER NOT NULL CHECK(birth_year=2026-age),
 template_id TEXT NOT NULL REFERENCES template_snapshots(template_id),
 standing TEXT NOT NULL CHECK(standing='staged'),
 provenance TEXT NOT NULL CHECK(provenance='fabricated_origin'),
 body_json TEXT NOT NULL CHECK(json_valid(body_json))
 CHECK(json_extract(body_json,'$.provenance')='fabricated_origin')
 CHECK(json_array_length(body_json,'$.authority_grants')=0)
 CHECK(json_array_length(body_json,'$.experienced_event_refs')=0),
 UNIQUE(world_id,identity_id)
);
CREATE TABLE decisions (
 decision_id TEXT PRIMARY KEY, world_id TEXT NOT NULL CHECK(world_id='V1'), identity_id TEXT NOT NULL,
 sequence INTEGER NOT NULL CHECK(sequence BETWEEN 1 AND 20),
 age INTEGER NOT NULL CHECK(age BETWEEN 16 AND 84), earth_year INTEGER NOT NULL CHECK(earth_year<=2026),
 scenario_id TEXT NOT NULL, choice_id TEXT NOT NULL,
 provenance TEXT NOT NULL CHECK(provenance='fabricated_origin'),
 body_json TEXT NOT NULL CHECK(json_valid(body_json)),
 FOREIGN KEY(world_id,identity_id) REFERENCES identities(world_id,identity_id),
 UNIQUE(identity_id,sequence), UNIQUE(identity_id,decision_id)
);
CREATE TABLE decision_links (
 identity_id TEXT NOT NULL, earlier_decision TEXT NOT NULL, later_decision TEXT NOT NULL,
 PRIMARY KEY(earlier_decision,later_decision),
 FOREIGN KEY(identity_id,earlier_decision) REFERENCES decisions(identity_id,decision_id),
 FOREIGN KEY(identity_id,later_decision) REFERENCES decisions(identity_id,decision_id)
);
CREATE TRIGGER chronological_link BEFORE INSERT ON decision_links BEGIN
 SELECT CASE WHEN (SELECT sequence FROM decisions WHERE decision_id=NEW.earlier_decision)>=(SELECT sequence FROM decisions WHERE decision_id=NEW.later_decision)
 THEN RAISE(ABORT,'decision link must point from earlier to later') END;
END;
CREATE TABLE relationships (
 relation_id TEXT PRIMARY KEY, world_id TEXT NOT NULL CHECK(world_id='V1'),
 from_id TEXT NOT NULL, to_id TEXT NOT NULL CHECK(to_id<>from_id), kind TEXT NOT NULL,
 provenance TEXT NOT NULL CHECK(provenance='fabricated_origin'), body_json TEXT NOT NULL CHECK(json_valid(body_json)),
 FOREIGN KEY(world_id,from_id) REFERENCES identities(world_id,identity_id),
 FOREIGN KEY(world_id,to_id) REFERENCES identities(world_id,identity_id)
);
CREATE INDEX decisions_by_identity ON decisions(identity_id,sequence);
CREATE INDEX identities_by_template ON identities(template_id);
CREATE INDEX relationship_destinations ON relationships(to_id);
