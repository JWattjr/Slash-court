import json

from tests.direct.conftest import RULEBOOK_HASH, RULEBOOK_TEXT


def test_case_policy_primitives_reject_unknown_rule_ids(court_contract, direct_vm, direct_owner):
    court = court_contract
    direct_vm.sender = direct_owner
    court.create_initial_rulebook(RULEBOOK_TEXT, RULEBOOK_HASH)
    with direct_vm.expect_revert("unknown or duplicate alleged rule ids"):
        court._validate_rule_ids(["R999"], "alleged rule ids")
    with direct_vm.expect_revert("unknown or duplicate alleged rule ids"):
        court._validate_rule_ids(["R3", "R3"], "alleged rule ids")
    assert court._validate_rule_ids(json.loads('["R3", "R4"]'), "alleged rule ids") == ["R3", "R4"]


def test_response_window_timestamp_arithmetic_is_canonical(court_contract):
    court = court_contract
    assert court._add_seconds("2025-01-01T23:59:59Z", 86_400) == "2025-01-02T23:59:59Z"
    assert court._add_seconds("2024-02-28T23:59:59Z", 86_400) == "2024-02-29T23:59:59Z"


def test_court_preserves_every_canonical_vault_duty_field(
    court_contract,
):
    context = court_contract._canonical_commitment_context({
        "commitment_id": "commitment-canonical",
        "operator": "0x" + "1" * 40,
        "beneficiary": "0x" + "2" * 40,
        "service_description": "Treasury maintenance duty",
        "duty_trigger": "scheduled-trigger-canonical",
        "duty_deadline": "2099-01-01T00:00:00Z",
        "dispute_deadline": "2099-01-02T00:00:00Z",
        "rulebook_version": 1,
        "locked_exposure": 20,
        "expected_action_id": "maintenance-action-canonical",
        "accepted": True,
        "commitment_digest": "sha256:" + "d" * 64,
    })
    assert context["service_description"] == "Treasury maintenance duty"
    assert context["duty_trigger"] == "scheduled-trigger-canonical"
    assert context["duty_deadline"] == "2099-01-01T00:00:00Z"
    assert context["dispute_deadline"] == "2099-01-02T00:00:00Z"
    assert context["expected_action_id"] == "maintenance-action-canonical"
    assert context["rulebook_version"] == 1
    assert context["locked_exposure"] == 20
    assert context["commitment_digest"].startswith("sha256:")
