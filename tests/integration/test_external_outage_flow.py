import pytest

from .conftest import build_protocol, run_case


@pytest.mark.integration
def test_external_outage_is_a_no_slash_resolution():
    protocol = build_protocol()
    result = run_case(protocol, "EXTERNAL_OUTAGE", exposure=20)
    assert result["case"]["classification"] == "EXTERNAL_OUTAGE"
    assert result["case"]["outcome"] == "NO_SLASH"
    assert result["application"]["penalty_amount"] == 0
    assert result["application"]["beneficiary_award"] == 0
    assert result["operator"]["total_bond"] == 100
    assert result["operator"]["available_bond"] == 100
