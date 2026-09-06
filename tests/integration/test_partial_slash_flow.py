import pytest

from .conftest import build_protocol, run_case


@pytest.mark.integration
def test_partial_slash_uses_fixed_half_exposure_mapping():
    protocol = build_protocol()
    result = run_case(protocol, "NEGLIGENT_FAILURE", exposure=20)
    assert result["case"]["classification"] == "NEGLIGENT_FAILURE"
    assert result["case"]["outcome"] == "PARTIAL_SLASH"
    assert result["case"]["penalty_bps"] == 5_000
    assert result["application"]["penalty_amount"] == 10
    assert result["application"]["beneficiary_award"] == 8
    assert result["application"]["safety_pool_amount"] == 2
    assert result["operator"]["total_bond"] == 90
    assert result["operator"]["available_bond"] == 90
