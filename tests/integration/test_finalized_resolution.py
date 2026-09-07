import pytest

from .conftest import build_protocol, finalized, fund_commitment, run_case


@pytest.mark.integration
def test_resolution_application_and_callback_are_finalized_and_replay_safe():
    protocol = build_protocol()
    result = run_case(protocol, "PROVABLE_MISCONDUCT", exposure=20)
    assert result["case"]["network_status"] == "FINALIZED"
    assert result["case"]["application_status"] == "APPLIED_FINALIZED"
    assert result["case"]["adjudication_finalized"] is True
    assert result["application"]["applied"] is True

    # The application record is keyed by case id. A retry after the callback
    # is finalized returns without changing balances or creating a second
    # award.
    finalized(protocol["court"].retry_resolution_application(args=["case-1"]))
    assert protocol["vault"].get_case_application(args=["case-1"]).call()["penalty_amount"] == 20
    assert protocol["vault"].get_operator(args=[protocol["operator"].address]).call()["total_bond"] == 80


@pytest.mark.integration
def test_silent_operator_can_be_marked_ready_after_bounded_timeout():
    protocol = build_protocol()
    fund_commitment(protocol, "commitment-timeout", exposure=20)
    court = protocol["court"].connect(protocol["beneficiary"])
    finalized(
        court.open_case(args=["commitment-timeout", "The keeper missed the duty.", "[]"]),
        triggered=True,
        context={"genvm_datetime": "2099-01-01T23:59:59Z"},
    )
    case = protocol["court"].get_case(args=["case-1"]).call()
    assert case["operator_response"] == ""
    assert case["response_deadline"] == "2099-01-02T23:59:59Z"

    finalized(
        court.mark_case_ready(args=["case-1", '["R1"]']),
        context={"genvm_datetime": "2099-01-03T00:00:00Z"},
    )
    assert protocol["court"].get_case(args=["case-1"]).call()["status"] == "READY_FOR_ADJUDICATION"


@pytest.mark.integration
def test_case_cancellation_unbinds_commitment_without_releasing_exposure():
    protocol = build_protocol()
    fund_commitment(protocol, "commitment-cancel", exposure=20)
    court = protocol["court"].connect(protocol["beneficiary"])
    finalized(
        court.open_case(args=["commitment-cancel", "The keeper missed the duty.", "[]"]),
        triggered=True,
    )
    finalized(court.cancel_case(args=["case-1"]), triggered=True)
    case = protocol["court"].get_case(args=["case-1"]).call()
    commitment = protocol["vault"].get_commitment(args=["commitment-cancel"]).call()
    assert case["status"] == "CANCELLED"
    assert case["network_status"] == "CANCELLED"
    assert commitment["status"] == "ACTIVE"
    assert commitment["case_id"] == ""
    assert protocol["vault"].get_balance_breakdown(args=[protocol["operator"].address]).call()["locked_exposure"] == 20
