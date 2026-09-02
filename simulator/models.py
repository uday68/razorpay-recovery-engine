"""
Data models module for payment simulation.
Defines the Customer and Payment data classes with properties for calculating
metrics like success rate and recovery rate.
"""

from dataclasses import dataclass
from datetime import datetime

@dataclass
class Customer:
    id:str
    successful_payments : int
    failed_payments:int
    recovered_payments:int

    @property
    def success_rate(self)-> float:
        total = self.successful_payments + self.failed_payments
        return self.successful_payments / total if total else 0.0
    @property
    def recovery_rate(self)->float:
        return(
            self.recovered_payments / self.failed_payments if self.failed_payments else 0.0
        )
@dataclass
class Payment:
    id: str
    customer_id: str
    amount: float
    payment_method: str
    bank: str
    failure_code: str | None
    timestamp: datetime
    status: str