pub mod delegation;
pub mod error;
pub mod hash;
pub mod init;
pub mod login;
pub mod macros;
pub mod rand;
pub mod settings;
pub mod signature_map;
pub mod siwb;
pub mod time;
pub mod utils;
pub use bitcoin;

pub use init::init;

use std::cell::RefCell;

use crate::settings::Settings;
use crate::siwb::SiwbMessageMap;
#[cfg(feature = "nonce")]
use rand_chacha::ChaCha20Rng;

thread_local! {
    // The random number generator is used to generate nonces for SIWB messages. This feature is
    // optional and can be enabled by setting the `nonce` feature flag.
    #[cfg(feature = "nonce")]
    static RNG: RefCell<Option<ChaCha20Rng>> = RefCell::new(None);

    // The settings control the behavior of the SIWB library. The settings must be initialized
    // before any other library functions are called.
    static SETTINGS: RefCell<Option<Settings>> = RefCell::new(None);

    // SIWB messages are stored in global state during the login process. The key is the
    // Bitcoin address as a byte array and the value is the SIWB message. After a successful
    // login, the SIWB message is removed from state.
    static SIWB_MESSAGES: RefCell<SiwbMessageMap> = RefCell::new(SiwbMessageMap::new());
}
