use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotFound = 1,
    NullifierAlreadyUsed = 2,
    VerifierAddressIsNotGAccount = 3,
    InvalidExpiration = 4,
    VerifierNotSet = 5,
    Revoked = 6,
    Expired = 7,
    FailedToParseDaysUntilExpiry = 8
}
