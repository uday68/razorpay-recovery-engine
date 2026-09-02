"""
Configuration module containing constants for payment simulation.
Defines payment methods, banks, failure codes, and recovery actions.
"""

PAYMENT_METHODS=[
    "UPI",
    "CARD",
    "NETBANKING",
    "WALLET"
]


BANKS = [
    "HDFC",
    "ICICI",
    "SBI",
    "AXIS",
    "KOTAK",
    "YESBANK",
]

FAILURE_CODES=[
    "BANK_TIMEOUT",
    "NETWORK_ERROR",
    "INSUFFICIENT_FUNDS",
    "CARD_EXPIRED",
    "LIMIT_EXCEEDED",
    "AUTHENTICATION_FAILED",
]

ACTION =[

    "RETRY_NOW",
    "RETRY_LATER",
    "SEND_REMINDER",
    "NO_ACTION"
]
