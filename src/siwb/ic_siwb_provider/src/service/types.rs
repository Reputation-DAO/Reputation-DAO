use std::borrow::Cow;

use ic_stable_structures::storable::Bound;
use ic_stable_structures::Storable;

#[derive(Ord, Eq, PartialEq, PartialOrd, Clone)]
pub struct AddressScriptBuf(pub Vec<u8>);

impl Storable for AddressScriptBuf {
    fn to_bytes(&self) -> Cow<[u8]> {
        self.0.to_bytes()
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Self(bytes.to_vec())
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: 128,
        is_fixed_size: false,
    };
}

// #[derive(CandidType, Serialize, Deserialize)]
// pub struct SiwbLoginParams {
//     pub signature: String,
//     pub address: String,
//     pub public_key: String,
//     pub session_key: ByteBuf,
//     pub bip_322_simple: bool,
// }
