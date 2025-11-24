use crate::hash::hash_with_domain;
use bitcoin::Network::{Bitcoin, Regtest, Testnet};
use bitcoin::{Address, AddressType, Network, ScriptBuf};
use candid::Principal;
use ic_cdk::api::management_canister::bitcoin::BitcoinNetwork;
use icrc_ledger_types::icrc1::account::Account;
use std::str::FromStr;

pub fn derive_account_from_address_and_owner_principal(
    owner: Principal,
    btc_address: String,
) -> Result<Account, String> {
    let address = get_script_from_address(btc_address)?;

    let address_id = match address.address_type {
        AddressType::P2pkh => 0u8,
        AddressType::P2sh => 1u8,
        AddressType::P2wpkh => 2u8,
        AddressType::P2wsh => 3u8,
        AddressType::P2tr => 4u8,
        _ => {
            return Err("Invalid address type".to_string());
        }
    };

    let chain_id = match address.network {
        Bitcoin => 0u8,
        Testnet => 1u8,
        _ => {
            return Err("Invalid network".to_string());
        }
    };

    let pre_sub = [chain_id, address_id];

    let sub_account = hash_with_domain(&pre_sub, &address.script_buf.into_bytes());

    Ok(Account {
        owner,
        subaccount: Some(sub_account),
    })
}

pub struct AddressInfo {
    pub address_raw: Address,
    pub address: String,
    pub script_buf: ScriptBuf,
    pub network: Network,
    pub address_type: AddressType,
}

pub fn get_script_from_address(address: String) -> Result<AddressInfo, String> {
    let mut network = Bitcoin;
    let mut address_type = AddressType::P2tr;

    if address.starts_with("bc1q") {
        address_type = AddressType::P2wpkh;
        network = Bitcoin;
    } else if address.starts_with("bc1p") {
        address_type = AddressType::P2tr;
        network = Bitcoin;
    } else if address.starts_with('1') {
        address_type = AddressType::P2pkh;
        network = Bitcoin;
    } else if address.starts_with('3') {
        address_type = AddressType::P2sh;
        network = Bitcoin;
    } else if address.starts_with("tb1q") {
        address_type = AddressType::P2wpkh;
        network = Testnet;
    } else if address.starts_with('m') || address.starts_with('n') {
        address_type = AddressType::P2pkh;
        network = Testnet;
    } else if address.starts_with('2') {
        address_type = AddressType::P2sh;
        network = Testnet;
    } else if address.starts_with("tb1p") {
        address_type = AddressType::P2tr;
        network = Testnet;
    }
    let addr = Address::from_str(address.as_str())
        .map_err(|e| format!("Cannot gen address {:?}", e).to_string())?;

    let addr_checked = addr
        .clone()
        .require_network(network)
        .map_err(|e| format!("Cannot require network {:?}", e).to_string())?;

    Ok(AddressInfo {
        address_raw: addr_checked.clone(),
        address: addr_checked.clone().to_string(),
        script_buf: addr_checked.clone().script_pubkey(),
        network,
        address_type,
    })
}

pub fn from_bitcoin_network(value: BitcoinNetwork) -> Network {
    match value {
        BitcoinNetwork::Mainnet => Bitcoin,
        BitcoinNetwork::Testnet => Testnet,
        BitcoinNetwork::Regtest => Regtest,
    }
}
