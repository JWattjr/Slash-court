import pytest

from .conftest import build_protocol, run_case


@pytest.mark.integration
def test_insufficient_evidence_fails_closed_without_penalty():
    protocol = build_protocol()
    result = run_case(protocol, "INSUFFICIENT_EVIDENCE", exposure=20)
    assert result["case"]["classification"] == "INSUFFICIENT_EVIDENCE"
    assert result["case"]["outcome"] == "NO_SLASH"
    assert result["application"]["penalty_amount"] == 0
    assert result["operator"]["total_bond"] == 100
    assert result["operator"]["available_bond"] == 100
