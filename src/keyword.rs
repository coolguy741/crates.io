use chrono::NaiveDateTime;
use diesel::prelude::*;
use diesel;

use models::Crate;
use schema::*;
use views::EncodableKeyword;

#[derive(Clone, Identifiable, Queryable, Debug)]
pub struct Keyword {
    pub id: i32,
    pub keyword: String,
    pub crates_cnt: i32,
    pub created_at: NaiveDateTime,
}

#[derive(Associations, Insertable, Identifiable, Debug, Clone, Copy)]
#[belongs_to(Keyword)]
#[belongs_to(Crate)]
#[table_name = "crates_keywords"]
#[primary_key(crate_id, keyword_id)]
pub struct CrateKeyword {
    crate_id: i32,
    keyword_id: i32,
}

impl Keyword {
    pub fn find_by_keyword(conn: &PgConnection, name: &str) -> QueryResult<Keyword> {
        keywords::table
            .filter(keywords::keyword.eq(::lower(name)))
            .first(&*conn)
    }

    pub fn find_or_create_all(conn: &PgConnection, names: &[&str]) -> QueryResult<Vec<Keyword>> {
        use diesel::dsl::any;

        let lowercase_names: Vec<_> = names.iter().map(|s| s.to_lowercase()).collect();

        let new_keywords: Vec<_> = lowercase_names
            .iter()
            .map(|s| keywords::keyword.eq(s))
            .collect();

        diesel::insert_into(keywords::table)
            .values(&new_keywords)
            .on_conflict_do_nothing()
            .execute(conn)?;
        keywords::table
            .filter(keywords::keyword.eq(any(&lowercase_names)))
            .load(conn)
    }

    pub fn valid_name(name: &str) -> bool {
        if name.is_empty() {
            return false;
        }
        name.chars().next().unwrap().is_alphanumeric()
            && name.chars()
                .all(|c| c.is_alphanumeric() || c == '_' || c == '-')
            && name.chars().all(|c| c.is_ascii())
    }

    pub fn encodable(self) -> EncodableKeyword {
        let Keyword {
            crates_cnt,
            keyword,
            created_at,
            ..
        } = self;
        EncodableKeyword {
            id: keyword.clone(),
            created_at: created_at,
            crates_cnt: crates_cnt,
            keyword: keyword,
        }
    }

    pub fn update_crate(conn: &PgConnection, krate: &Crate, keywords: &[&str]) -> QueryResult<()> {
        conn.transaction(|| {
            let keywords = Keyword::find_or_create_all(conn, keywords)?;
            diesel::delete(CrateKeyword::belonging_to(krate)).execute(conn)?;
            let crate_keywords = keywords
                .into_iter()
                .map(|kw| CrateKeyword {
                    crate_id: krate.id,
                    keyword_id: kw.id,
                })
                .collect::<Vec<_>>();
            diesel::insert_into(crates_keywords::table)
                .values(&crate_keywords)
                .execute(conn)?;
            Ok(())
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::NaiveDate;
    use diesel;
    use diesel::connection::SimpleConnection;
    use dotenv::dotenv;
    use serde_json;
    use std::env;

    fn pg_connection() -> PgConnection {
        let _ = dotenv();
        let database_url =
            env::var("TEST_DATABASE_URL").expect("TEST_DATABASE_URL must be set to run tests");
        let conn = PgConnection::establish(&database_url).unwrap();
        // These tests deadlock if run concurrently
        conn.batch_execute("BEGIN;").unwrap();
        conn
    }

    #[test]
    fn dont_associate_with_non_lowercased_keywords() {
        let conn = pg_connection();
        // The code should be preventing lowercased keywords from existing,
        // but if one happens to sneak in there, don't associate crates with it.

        diesel::insert_into(keywords::table)
            .values(keywords::keyword.eq("NO"))
            .execute(&conn)
            .unwrap();

        let associated = Keyword::find_or_create_all(&conn, &["no"]).unwrap();
        assert_eq!(associated.len(), 1);
        assert_eq!(associated.first().unwrap().keyword, "no");
    }

    #[test]
    fn keyword_serializes_to_rfc3339() {
        let key = EncodableKeyword {
            id: "".to_string(),
            keyword: "".to_string(),
            created_at: NaiveDate::from_ymd(2017, 1, 6).and_hms(14, 23, 11),
            crates_cnt: 0,
        };
        let json = serde_json::to_string(&key).unwrap();
        assert!(
            json.as_str()
                .find(r#""created_at":"2017-01-06T14:23:11+00:00""#)
                .is_some()
        );
    }

}
