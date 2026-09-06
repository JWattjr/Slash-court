import pytest

from .conftest import build_protocol, finalized, run_case


@pytest.mark.integration
def test_resolution_application_and_callback_are_finalized_and_replay_safe():
    protocol = build_protocol()
    result = run_case(protocol, "PROVABLE_MISCONDUCT", exposure=20)
    assert result["case"]["network_status"] == "FINALIZED"
    assert result["case"]["application_status"] == "APPLIED_FINALIZED"
    assert result["application"]["applied"] is True

    # The application record is keyed by case id. A retry after the callback
    # is finalized returns without changing balances or creating a second
    # award.
    finalized(protocol["court"].retry_resolution_application(args=["case-1"]))
    assert protocol["vault"].get_case_application(args=["case-1"]).call()["penalty_amount"] == 20
    assert protocol["vault"].get_operator(args=[protocol["operator"].address]).call()["total_bond"] == 80
