import json
from types import SimpleNamespace


def test_all_four_classifications_have_structured_guardrails(court_contract):
    court = court_contract
    case = SimpleNamespace(alleged_rule_ids_json='["R3","R4","R5"]')
    evidence = [{
        "evidence_id": "E1",
        "evidence_type": "PUBLIC_STATUS",
        "submission_party": "CLAIMANT",
        "source_domain": "status.example.org",
        "content_hash": "sha256:" + "a" * 64,
        "relevant_rule_ids": ["R3", "R4", "R5"],
    }]
    examples = [
        (
            "PROVABLE_MISCONDUCT",
            ["R5"],
            [],
            "FULL_SLASH",
        ),
        (
            "NEGLIGENT_FAILURE",
            ["R3"],
            [],
            "PARTIAL_SLASH",
        ),
        (
            "EXTERNAL_OUTAGE",
            [],
            ["R4"],
            "NO_SLASH",
        ),
        (
            "INSUFFICIENT_EVIDENCE",
            [],
            [],
            "NO_SLASH",
        ),
    ]
    for classification, violated, exemptions, outcome in examples:
        findings = []
        if outcome != "NO_SLASH":
            findings = [{"evidence_id": "E1", "rule_id": violated[0], "finding": "Cited fact."}]
        result = court._parse_model_result(
            {
                "classification": classification,
                "violated_rule_ids": violated,
                "supported_exemption_ids": exemptions,
                "findings": findings,
                "explanation": "A bounded explanation.",
            },
            case,
            evidence,
        )
        assert result["outcome"] == outcome


def test_contradictory_structured_results_fail_closed(court_contract, direct_vm):
    case = SimpleNamespace(alleged_rule_ids_json='["R3","R4"]')
    evidence = [{
        "evidence_id": "E1",
        "evidence_type": "PUBLIC_STATUS",
        "submission_party": "CLAIMANT",
        "source_domain": "status.example.org",
        "content_hash": "sha256:" + "a" * 64,
        "relevant_rule_ids": ["R3", "R4"],
    }]
    with direct_vm.expect_revert("outage requires supported exemption"):
        court_contract._parse_model_result(
            {
                "classification": "EXTERNAL_OUTAGE",
                "violated_rule_ids": [],
                "supported_exemption_ids": [],
                "findings": [],
                "explanation": "No exemption was actually supported.",
            },
            case,
            evidence,
        )
    with direct_vm.expect_revert("insufficient evidence cannot assert breach"):
        court_contract._parse_model_result(
            {
                "classification": "INSUFFICIENT_EVIDENCE",
                "violated_rule_ids": ["R3"],
                "supported_exemption_ids": [],
                "findings": [],
                "explanation": "Uncertainty is not a breach finding.",
            },
            case,
            evidence,
        )
