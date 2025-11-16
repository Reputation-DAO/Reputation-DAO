use ic_cdk::query;
use ic_siwb::bitcoin::Network::{Bitcoin, Regtest, Signet, Testnet};
use ic_siwb::bitcoin::{Address, ScriptBuf};
use ic_stable_structures::storable::Blob;
use serde_bytes::ByteBuf;

use crate::{PRINCIPAL_ADDRESS, SETTINGS};

/// Retrieves the Bitcoin address associated with a given IC principal.
///
/// # Arguments
/// * `principal` - A `ByteBuf` containing the principal's bytes, expected to be 29 bytes.
///
/// # Returns
/// * `Ok(String)` - The EIP-55-compliant Bitcoin address if found.
/// * `Err(String)` - An error message if the principal cannot be converted or no address is found.
#[query]
pub(crate) fn get_address(principal: ByteBuf, network: String) -> Result<String, String> {
    SETTINGS.with_borrow(|s| {
        if s.disable_principal_to_btc_mapping {
            return Err("Principal to Bitcoin address mapping is disabled".to_string());
        }
        Ok(())
    })?;

    let principal: Blob<29> = principal
        .as_ref()
        .try_into()
        .map_err(|_| "Failed to convert ByteBuf to Blob<29>")?;

    let _network = match network.as_str() {
        "bitcoin" => Bitcoin,
        "mainnet" => Bitcoin,
        "testnet" => Testnet,
        "regtest" => Regtest,
        "signet" => Signet,
        _ => return Err("Invalid network".to_string()),
    };

    let address = PRINCIPAL_ADDRESS.with(|pa| {
        pa.borrow().get(&principal).map_or(
            Err("No address found for the given principal".to_string()),
            |a| {
                let s = a.0;
                let script_buf = ScriptBuf::from(s);
                Address::from_script(script_buf.as_script(), _network)
                    .map(|a| a)
                    .map_err(|e| e.to_string())
            },
        )
    })?;

    Ok(address.to_string())
}
