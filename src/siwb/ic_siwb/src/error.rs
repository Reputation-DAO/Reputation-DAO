use std::fmt;

#[derive(Debug)]
pub enum BtcError {
    AddressTypeNotSupported,
    AddressFormatError(String),
    DecodingError(hex::FromHexError),
    SignatureFormatError(String),
    InvalidSignature,
    InvalidRecoveryId,
    PublicKeyRecoveryFailure,
}

impl From<hex::FromHexError> for BtcError {
    fn from(err: hex::FromHexError) -> Self {
        BtcError::DecodingError(err)
    }
}

impl fmt::Display for BtcError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            BtcError::AddressFormatError(e) => write!(f, "Address format error: {}", e),
            BtcError::DecodingError(e) => write!(f, "Decoding error: {}", e),
            BtcError::SignatureFormatError(e) => write!(f, "Signature format error: {}", e),
            BtcError::InvalidSignature => write!(f, "Invalid signature"),
            BtcError::InvalidRecoveryId => write!(f, "Invalid recovery ID"),
            BtcError::PublicKeyRecoveryFailure => {
                write!(f, "Public key recovery failure")
            }
            BtcError::AddressTypeNotSupported => {
                write!(f, "Address type not supported")
            }
        }
    }
}

impl From<BtcError> for String {
    fn from(error: BtcError) -> Self {
        error.to_string()
    }
}
