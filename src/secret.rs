use once_cell::sync::Lazy;
use shuttle_runtime::SecretStore;
use std::sync::Mutex;

static SECRETS: Lazy<Mutex<Option<SecretStore>>> = Lazy::new(|| Mutex::new(None));

pub fn get_secret(key: &str) -> Option<String> {
    let secrets = SECRETS.lock().unwrap();
    secrets.as_ref()?.get(key).map(|s| s.to_string())
}

pub fn initialize_secrets(secrets: SecretStore) {
    *SECRETS.lock().unwrap() = Some(secrets);
}
