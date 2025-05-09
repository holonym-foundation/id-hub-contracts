use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotFound = 1,
    NullifierAlreadyUsed = 2,
    InvalidExpiration = 3,
    AdminNotSet = 4,
    Revoked = 5,
    Expired = 6,
    FailedToParseDaysUntilExpiry = 7,
    InvalidAdmin = 8,
}
