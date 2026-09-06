import pytest

from .conftest import build_protocol, run_case


@pytest.mark.integration
def test_full_slash_consumes_only_commitment_exposure_and_allocates_80_20():
    protocol = build_protocol()
    result = run_case(protocol, "PROVABLE_MISCONDUCT", exposure=20)
    assert result["case"]["classification"] == "PROVABLE_MISCONDUCT"
    assert result["case"]["outcome"] == "FULL_SLASH"
    assert result["application"]["penalty_amount"] == 20
    assert result["application"]["beneficiary_award"] == 16
    assert result["application"]["safety_pool_amount"] == 4
    assert result["operator"]["total_bond"] == 80
    assert result["operator"]["available_bond"] == 80
    assert result["commitment"]["status"] == "RESOLVED"
