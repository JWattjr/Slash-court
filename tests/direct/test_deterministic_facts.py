import json
from types import SimpleNamespace


def test_deterministic_facts_are_bounded_and_do_not_make_a_judgment(court_contract):
    court = court_contract
    case = SimpleNamespace(
        commitment_id="commitment-facts",
        commitment_exposure=20,
        canonical_commitment_json=json.dumps({
            "commitment_id": "commitment-facts",
            "locked_exposure": 20,
            "duty_trigger": "scheduled-trigger",
            "duty_deadline": "2099-01-01T00:00:00Z",
            "dispute_deadline": "2099-01-02T00:00:00Z",
            "expected_action_id": "maintenance-action",
        }),
        alleged_rule_ids_json='["R3"]',
        claimant_evidence_json=json.dumps(
            [{"evidence_id": "E1", "source_domain": "status.example.org", "submission_party": "CLAIMANT", "relevant_rule_ids": ["R3"]}]
        ),
        operator_evidence_json=json.dumps(
            [{"evidence_id": "E2", "source_domain": "evidence.example.com", "submission_party": "OPERATOR", "relevant_rule_ids": ["R3"]}]
        ),
        operator_response="A bounded response",
    )
    facts = court._deterministic_facts(case)
    assert facts["commitment_exposure"] == 20
    assert facts["claimant_evidence_count"] == 1
    assert facts["operator_evidence_count"] == 1
    assert facts["operator_responded"] is True
    assert facts["evidence_ids"] == ["E1", "E2"]
    assert facts["duty_trigger"] == "scheduled-trigger"
    assert facts["expected_action_id"] == "maintenance-action"
    assert facts["alleged_rule_ids"] == ["R3"]
    assert "classification" not in facts


def test_classification_mapping_is_closed_and_deterministic(court_contract):
    court = court_contract
    assert court._outcome_for("PROVABLE_MISCONDUCT") == "FULL_SLASH"
    assert court._outcome_for("NEGLIGENT_FAILURE") == "PARTIAL_SLASH"
    assert court._outcome_for("EXTERNAL_OUTAGE") == "NO_SLASH"
    assert court._outcome_for("INSUFFICIENT_EVIDENCE") == "NO_SLASH"
    assert court._bps_for("PROVABLE_MISCONDUCT") == 10_000
    assert court._bps_for("NEGLIGENT_FAILURE") == 5_000
    assert court._bps_for("EXTERNAL_OUTAGE") == 0
