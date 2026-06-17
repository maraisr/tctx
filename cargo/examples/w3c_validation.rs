#![deny(unsafe_code)]

use std::net::SocketAddr;

use axum::{
    extract::Json,
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::post,
    Router,
};
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
struct Payload {
    url: String,
    arguments: Vec<Payload>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let addr = SocketAddr::from(([127, 0, 0, 1], 8000));
    let app = Router::new().route("/test", post(test));
    let listener = tokio::net::TcpListener::bind(addr).await?;

    println!("test service listening on http://{addr}/test");
    axum::serve(listener, app).await?;

    Ok(())
}

async fn test(headers: HeaderMap, Json(payload): Json<Vec<Payload>>) -> impl IntoResponse {
    let traceparent_v = headers
        .get("traceparent")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| traceparent::parse(value).ok())
        .unwrap_or_else(|| traceparent::make(true));

    let client = reqwest::Client::new();

    for item in payload {
        let request = client
            .post(item.url)
            .header("traceparent", traceparent_v.child(true).to_string())
            .json(&item.arguments);

        let _response = request.send().await;
    }

    (StatusCode::OK, "OK")
}
