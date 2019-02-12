use std::env;

use conduit::Request;
use diesel::prelude::*;
use diesel::r2d2::{self, ConnectionManager, CustomizeConnection};
use parking_lot::{ReentrantMutex, ReentrantMutexGuard};
use std::sync::Arc;
use std::ops::Deref;
use url::Url;

use crate::middleware::app::RequestApp;
use crate::util::CargoResult;
use crate::Env;

#[allow(missing_debug_implementations)]
#[derive(Clone)]
pub enum DieselPool {
    Pool(r2d2::Pool<ConnectionManager<PgConnection>>),
    Test(Arc<ReentrantMutex<PgConnection>>),
}

impl DieselPool {
    pub fn get(&self) -> CargoResult<DieselPooledConn> {
        match self {
            DieselPool::Pool(pool) => Ok(DieselPooledConn::Pool(pool.get()?)),
            DieselPool::Test(conn) => Ok(DieselPooledConn::Test(conn.lock())),
        }
    }

    pub fn state(&self) -> r2d2::State {
        match self {
            DieselPool::Pool(pool) => pool.state(),
            DieselPool::Test(_) => panic!("Cannot get the state of a test pool"),
        }
    }

    fn test_conn(conn: PgConnection) -> Self {
        DieselPool::Test(Arc::new(ReentrantMutex::new(conn)))
    }
}

#[allow(missing_debug_implementations)]
pub enum DieselPooledConn<'a> {
    Pool(r2d2::PooledConnection<ConnectionManager<PgConnection>>),
    Test(ReentrantMutexGuard<'a, PgConnection>),
}

unsafe impl<'a> Send for DieselPooledConn<'a> {}

impl Deref for DieselPooledConn<'_> {
    type Target = PgConnection;

    fn deref(&self) -> &Self::Target {
        match self {
            DieselPooledConn::Pool(conn) => conn.deref(),
            DieselPooledConn::Test(conn) => conn.deref(),
        }
    }
}

pub fn connect_now() -> ConnectionResult<PgConnection> {
    use diesel::Connection;
    let mut url = Url::parse(&crate::env("DATABASE_URL")).expect("Invalid database URL");
    if env::var("HEROKU").is_ok() && !url.query_pairs().any(|(k, _)| k == "sslmode") {
        url.query_pairs_mut().append_pair("sslmode", "require");
    }
    PgConnection::establish(&url.to_string())
}

pub fn diesel_pool(
    url: &str,
    env: Env,
    config: r2d2::Builder<ConnectionManager<PgConnection>>,
) -> DieselPool {
    let mut url = Url::parse(url).expect("Invalid database URL");
    if env::var("HEROKU").is_ok() && !url.query_pairs().any(|(k, _)| k == "sslmode") {
        url.query_pairs_mut().append_pair("sslmode", "require");
    }

    if env == Env::Test {
        let conn =
            PgConnection::establish(&url.into_string()).expect("failed to establish connection");
        DieselPool::test_conn(conn)
    } else {
        let manager = ConnectionManager::new(url.into_string());
        DieselPool::Pool(config.build(manager).unwrap())
    }
}

pub trait RequestTransaction {
    /// Return the lazily initialized postgres connection for this request.
    ///
    /// The connection will live for the lifetime of the request.
    // FIXME: This description does not match the implementation below.
    fn db_conn(&self) -> CargoResult<DieselPooledConn>;
}

impl<T: Request + ?Sized> RequestTransaction for T {
    fn db_conn(&self) -> CargoResult<DieselPooledConn> {
        self.app().diesel_database.get().map_err(Into::into)
    }
}

#[derive(Debug, Clone, Copy)]
pub struct SetStatementTimeout(pub u64);

impl CustomizeConnection<PgConnection, r2d2::Error> for SetStatementTimeout {
    fn on_acquire(&self, conn: &mut PgConnection) -> Result<(), r2d2::Error> {
        use diesel::sql_query;

        sql_query(format!("SET statement_timeout = {}", self.0 * 1000))
            .execute(conn)
            .map_err(r2d2::Error::QueryError)?;
        Ok(())
    }
}
