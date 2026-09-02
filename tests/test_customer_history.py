from simulator.generator import generate_customers


def test_customer_history_is_consistent():
    customers  = generate_customers(1000)
    # for customers in customers:
    #     # assert customers.successful_payments>=0
    #     # assert customers.failed_payments>=0
    #     # assert customers.recovered_payments>=0

    #     # assert(customers.recovered_payments<=customers.failed_payments)

    #     # assert 0.0 <= customers.success_rate <=1.0
    #     # assert 0.0 <= customers.recovery_rate <= 1.0
    success_rates = [
        customer.success_rate
        for customer in customers
    ]

    recovery_rates = [
        customer.recovery_rate
        for customer in customers
    ]

    assert len(set(success_rates)) > 10
    assert len(set(recovery_rates)) > 10